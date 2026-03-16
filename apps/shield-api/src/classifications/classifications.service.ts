import { HttpException, HttpStatus, Inject, Injectable, Logger } from "@nestjs/common";
import { Db, Filter, ObjectId, WithId } from "mongodb";
import { Domain } from "src/domains/domains.dto";
import { ClassificationOutput, InsertClassificationInput } from "./classifications.interface";
import { Classification } from "./classifications.classes";
import { ExcelService } from "src/excel/excel.service";
import AuditingService from "src/auditing/auditing.service";
import { customDiff } from "src/utils/utils";
import { InsertAuditDocument, AUDITING_UNKNOWN } from "src/auditing/auditing.types";
import { stringify } from "@port/utils";
import { DB_CONNECTION_PROVIDER, INTERNAL_RESOURCE_ID } from "src/utils/constants";
import { OP, Resource, Classification as MongooseClassification } from "@port/shield-models";
import { OpenFgaService } from "src/openfga/openfga.service";
import { FGATupleKey, formatFGAObjectId } from "@port/openfga-client";
import { Model } from "mongoose";
import { InjectModel } from "@nestjs/mongoose";
import { UserID } from "@port/common-schemas";

@Injectable()
export class ClassificationsService {
  private readonly logger = new Logger(ClassificationsService.name);
  constructor(
    /**@deprecated */
    @Inject(DB_CONNECTION_PROVIDER)
    private db: Db,
    private readonly excelService: ExcelService,
    private readonly auditingService: AuditingService,
    private readonly openFgaService: OpenFgaService,
    @InjectModel(MongooseClassification.name) private readonly classificationsModel: Model<MongooseClassification>,
  ) {}

  async getAllClassifications() {
    return this.classificationsModel.find().exec();
  }

  async getClassificationsWithRelatedDomains(): Promise<ClassificationOutput[]> {
    const pipeline = [
      {
        $match: {
          _id: { $ne: new ObjectId(INTERNAL_RESOURCE_ID) },
        },
      },
      {
        $lookup: {
          from: "domains",
          let: { classifications_id: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $in: ["$$classifications_id", "$classifications"] },
              },
            },
            { $project: { _id: 1, display_name: 1 } },
          ],
          as: "related_domains",
        },
      },
    ];
    const classifications = await this.db.collection<Classification>("classifications").aggregate<ClassificationOutput>(pipeline).toArray();

    return classifications;
  }

  /**
   * @audits
   * TODO: handle authz
   */
  async createClassification(classification: InsertClassificationInput, userId: UserID): Promise<ObjectId> {
    try {
      const isExist = await this.db.collection<Classification>("classifications").findOne({ name: classification.name });

      if (isExist !== null) {
        throw new HttpException("ההרשאה כבר קיימת", HttpStatus.BAD_REQUEST);
      } else {
        const insertedObject = await this.db.collection<Classification>("classifications").insertOne({
          name: classification.name,
          description: classification.description,
        });
        const updateDomainsSuccess = await this.addClassificationToDomains(
          insertedObject.insertedId,
          classification.related_domains,
          userId,
        );
        if (!updateDomainsSuccess) {
          this.logger.error("Error with updateDomainsSuccess");
        }

        this.auditingService.insertLegacyAudit({
          user_id: userId,
          operation: OP.Create,
          resource: Resource.Classification,
          status: "success",
          resource_info: {
            id: insertedObject.insertedId.toString(),
            name: classification.name,
          },
          message: "Created Classification",
          difference: customDiff(
            {},
            { name: classification.name, description: classification.description } satisfies Classification,
            false,
          ),
        });
        return insertedObject.insertedId;
      }
    } catch (error) {
      this.auditingService.insertLegacyAudit({
        user_id: userId,
        operation: OP.Create,
        resource: Resource.Classification,
        status: "error",
        resource_info: {
          id: AUDITING_UNKNOWN,
          name: classification.name,
        },
        message: stringify(error),
        response_error_message: AUDITING_UNKNOWN,
      });

      throw error;
    }
  }

  /**
   * @audits
   * TODO: handle authz
   */
  async addClassificationToDomains(classificationId: ObjectId, domainIds: string[], userId: UserID) {
    try {
      const domainOIDs = domainIds.map((x) => new ObjectId(x));
      const findFilter: Filter<Domain> = {
        _id: { $in: domainOIDs },
        classifications: { $nin: [classificationId] },
      };
      const existingDomains = await this.db.collection<Domain>("domains").find(findFilter).toArray();
      const updatedDomain = await this.db.collection<Domain>("domains").updateMany(findFilter, {
        $push: {
          classifications: classificationId,
        },
      });

      try {
        const modifiedDomains = await this.db
          .collection<Domain>("domains")
          .find({
            _id: { $in: existingDomains.map((domain) => domain._id) },
          })
          .toArray();

        const tupleDomainsWithClassification: FGATupleKey[] = modifiedDomains.map((domain) => ({
          user: formatFGAObjectId({ type: "domain", id: domain._id.toString() }),
          relation: "domain",
          object: formatFGAObjectId({
            type: "domain_classification",
            id: OpenFgaService.formatDomainClassification(domain._id, classificationId),
          }),
        }));

        await this.openFgaService.writeTuplesBatch(tupleDomainsWithClassification);

        this.auditingService.insertLegacyAudit(
          ...existingDomains.map<InsertAuditDocument>((existing) => ({
            user_id: userId,
            operation: OP.Update,
            resource: Resource.Domain,
            status: "success",
            resource_info: {
              id: existing._id.toString(),
              name: existing.name,
            },
            message: "Updated Domain",
            difference: customDiff(
              existing,
              modifiedDomains.find((modified) => modified._id.equals(existing._id)),
              true,
            ),
          })),
        );
      } catch (error) {
        this.logger.warn(error);
      }
      return updatedDomain.modifiedCount === domainIds.length;
    } catch (error) {
      this.auditingService.insertLegacyAudit(
        ...domainIds.map<InsertAuditDocument>((domainId) => ({
          user_id: userId,
          operation: OP.Update,
          resource: Resource.Domain,
          status: "error",
          resource_info: {
            id: domainId.toString(),
            name: AUDITING_UNKNOWN,
          },
          message: stringify(error),
          response_error_message: AUDITING_UNKNOWN,
        })),
      );

      throw error;
    }
  }

  /**
   * @audits
   * TODO: handle authz
   */
  async editClassificationById(id: ObjectId, name: string, description: string, userId: UserID): Promise<void> {
    try {
      const currentClassification = await this.db
        .collection<Classification>("classifications")
        .findOneAndUpdate({ _id: id }, { $set: { name: name, description: description } }, { returnDocument: "before" });

      this.auditingService.insertLegacyAudit({
        user_id: userId,
        operation: OP.Update,
        resource: Resource.Classification,
        status: "success",
        resource_info: {
          id: id.toString(),
          name: name,
        },
        message: "Updated Classification",
        difference: customDiff(
          { name: currentClassification.name, description: currentClassification.description } satisfies Classification,
          { name, description } satisfies Classification,
          false,
        ),
      });
    } catch (error) {
      this.auditingService.insertLegacyAudit({
        user_id: userId,
        operation: OP.Update,
        resource: Resource.Classification,
        status: "error",
        resource_info: {
          id: id.toString(),
          name: name,
        },
        message: stringify(error),
        response_error_message: AUDITING_UNKNOWN,
      });

      throw error;
    }
  }

  async getClassificationsByIds(ids: ObjectId[]): Promise<WithId<Classification>[]> {
    return await this.db
      .collection<WithId<Classification>>("classifications")
      .find({ _id: { $in: ids } })
      .toArray();
  }

  async getClassificationsExcel(): Promise<unknown> {
    const classifications = await this.getClassificationsWithRelatedDomains();

    const classificationsExcel = classifications.map((classification) => {
      return {
        name: classification.name,
        description: classification.description,
        related_domains: classification.related_domains.map((domain) => domain.display_name).join(", "),
      };
    });

    const classsificatiosExcelFile = this.excelService.convertToExcel(classificationsExcel, [
      { name: "name", displayName: "שם רמת הרשאה", options: { wch: 17 } },
      { name: "description", displayName: "תיאור", options: { wch: 45 } },
      { name: "related_domains", displayName: "עולמות תוכן מקושרים", options: { wch: 160 } },
    ]);

    return classsificatiosExcelFile;
  }
}
