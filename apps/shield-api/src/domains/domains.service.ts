import {
  ForbiddenException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { UserID } from "@port/common-schemas";
import { FGADomainRelationConstants, FGADomainRelations, formatFGAObjectId } from "@port/openfga-client";
import { Domain as MongooseDomain, ApplicationUser as MongooseApplicationUser, OP, Resource } from "@port/shield-models";
import { stringify } from "@port/utils";
import { Db, ObjectId, WithId } from "mongodb";
import { Model } from "mongoose";
import AuditingService from "src/auditing/auditing.service";
import { AUDITING_UNKNOWN } from "src/auditing/auditing.types";
import { LoggedUser } from "src/auth/auth.interface";
import { Classification } from "src/classifications/classifications.classes";
import { ClassificationsService } from "src/classifications/classifications.service";
import { ExcelService } from "src/excel/excel.service";
import { OpenFgaService } from "src/openfga/openfga.service";
import { toFullName } from "src/user-info/user-info.utils";
import { User } from "src/user/user.classes";
import { DB_CONNECTION_PROVIDER, INTERNAL_RESOURCE_ID } from "src/utils/constants";
import { customDiff } from "src/utils/utils";
import { CreateDomainDto, Domain, DomainWithClassificationsDto, EditDomainDto } from "./domains.dto";
import { DomainClassificationExposures, DomainsDictionary } from "./domains.interface";

@Injectable()
export class DomainsService {
  private readonly logger = new Logger(DomainsService.name);

  constructor(
    /**@deprecated */
    @Inject(DB_CONNECTION_PROVIDER)
    private readonly db: Db,
    private readonly auditingService: AuditingService,
    private readonly classificationsService: ClassificationsService,
    private readonly excelService: ExcelService,
    private readonly openFgaService: OpenFgaService,
    @InjectModel(MongooseDomain.name) private readonly domainModel: Model<MongooseDomain>,
    @InjectModel(MongooseApplicationUser.name) private readonly applicationUserModel: Model<MongooseApplicationUser>,
  ) {}

  async getById(id: ObjectId): Promise<MongooseDomain | null> {
    return await this.domainModel.findById(id).exec();
  }

  async getByIds(ids: ObjectId[]) {
    return await this.domainModel.find({ _id: { $in: ids } }).exec();
  }

  async getDomainsDictionary(): Promise<DomainsDictionary> {
    const domains = await this.db
      .collection<Domain>("domains")
      .aggregate([
        {
          $match: { _id: { $ne: new ObjectId(INTERNAL_RESOURCE_ID) } },
        },
        {
          $lookup: {
            from: "classifications",
            localField: "classifications",
            foreignField: "_id",
            as: "classifications",
          },
        },
        {
          $group: {
            _id: null,
            result: {
              $push: {
                k: {
                  $toString: "$_id",
                },
                v: "$$ROOT",
              },
            },
          },
        },
        { $replaceRoot: { newRoot: { $arrayToObject: "$result" } } },
      ])
      .toArray();

    if (domains.length < 1) throw new NotFoundException("No domains found");

    return domains[0];
  }

  async getAllDomains(): Promise<WithId<Domain>[]> {
    return await this.db
      .collection<Domain>("domains")
      .find({ _id: { $ne: new ObjectId(INTERNAL_RESOURCE_ID) } })
      .toArray();
  }

  async getDomainsByDomainRelation(
    loggedUserId: LoggedUser["userId"],
    relation:
      | {
          relationDomain: "can_manage_data_permissions";
          relationClassification: "can_assign_to_user";
        }
      | { relationDomain: "can_classify_tables"; relationClassification: "can_assign_to_table" }
      | {
          relationDomain: "has_any_data_permissions";
          relationClassification: "assigner";
        },
  ): Promise<WithId<Domain>[]> {
    const domainIds = await this.openFgaService.getUserDomainIdsByRelation(loggedUserId, relation.relationDomain);
    const domains = await this.getDomainsByIds(domainIds);

    const { objects: domains_classifications } = await this.openFgaService.listObjects({
      user: formatFGAObjectId({ type: "user", id: loggedUserId }),
      relation: relation.relationClassification,
      type: "domain_classification",
    });

    const classificationsByDomainId = this.openFgaService.getClassificationsByDomainID(domains_classifications);

    const mergedDomains = domains.map<WithId<Domain>>((domain) => {
      const classifications = classificationsByDomainId[domain._id.toString()] ?? [];

      return {
        ...domain,
        classifications,
      };
    });

    return mergedDomains;
  }

  async getDomainsByIds(domainIds: ObjectId[]) {
    return await this.db
      .collection<Domain>("domains")
      .find({ _id: { $in: domainIds } })
      .toArray();
  }

  async getUsersWithRelationOnDomain(domainId: string, relation: FGADomainRelations) {
    return await this.openFgaService.listUsers({
      user_filters: [{ type: "user" }],
      relation,
      object: { type: "domain", id: domainId },
    });
  }

  async getDomainClassifications(id: string, loggedUserId: LoggedUser["userId"]): Promise<WithId<Classification>[]> {
    const { objects: domains_classifications } = await this.openFgaService.listObjects({
      user: formatFGAObjectId({ type: "user", id: loggedUserId }),
      relation: "can_assign_to_user",
      type: "domain_classification",
    });

    const classificationsByDomainId = this.openFgaService.getClassificationsByDomainID(domains_classifications);
    const classificationIds = classificationsByDomainId[id];

    if (!classificationIds || classificationIds.length === 0) {
      return [];
    }

    const classifications = await this.db
      .collection<Classification>("classifications")
      .find({ _id: { $in: classificationIds } })
      .toArray();

    return classifications;
  }

  async getDomainByName(name: string): Promise<Domain | null> {
    return await this.db.collection<Domain>("domains").findOne({ name });
  }

  async getDomainById(_id: ObjectId): Promise<WithId<Domain> | null> {
    return await this.db.collection<Domain>("domains").findOne({ _id });
  }

  /**
   * @audits
   */
  async createDomain(domain: CreateDomainDto, userId: UserID): Promise<void> {
    try {
      const existingDomain = await this.getDomainByName(domain.name);

      if (existingDomain) {
        throw new HttpException(`קיים כבר דומיין עם השם ${domain.name}`, HttpStatus.CONFLICT);
      }

      const classifications = await this.classificationsService.getClassificationsByIds(domain.classifications);

      if (classifications.length !== domain.classifications.length) {
        throw new HttpException("נראה שנשלחו סיווגים לא תקינים", HttpStatus.BAD_REQUEST);
      }

      const insertData: Domain = {
        name: domain.name,
        display_name: domain.display_name,
        classifications: domain.classifications,
      };
      const inserted = await this.db.collection<Domain>("domains").insertOne(insertData);

      if (inserted.acknowledged) {
        await this.openFgaService.writeTuplesBatch([
          this.openFgaService.generateDomainTuples({ _id: inserted.insertedId }),
          ...this.openFgaService.generateDomainClassificationTuples({
            _id: inserted.insertedId,
            classifications: domain.classifications,
          }),
        ]);
      }

      this.auditingService.insertLegacyAudit({
        user_id: userId,
        operation: OP.Create,
        resource: Resource.Domain,
        status: "success",
        resource_info: {
          id: inserted.insertedId.toString(),
          name: insertData.name,
        },
        message: "Created Domain",
        difference: customDiff({}, { ...insertData, _id: inserted.insertedId }, true),
      });
    } catch (error) {
      this.auditingService.insertLegacyAudit({
        user_id: userId,
        operation: OP.Create,
        resource: Resource.Domain,
        status: "error",
        resource_info: {
          id: AUDITING_UNKNOWN,
          name: domain.name,
        },
        message: stringify(error),
        response_error_message: error instanceof HttpException ? error.message : "קרתה תקלה ביצירת עולם התוכן",
      });

      if (error instanceof HttpException) {
        throw error;
      } else {
        throw new InternalServerErrorException("קרתה תקלה ביצירת עולם התוכן");
      }
    }
  }

  /**
   * @audits
   */
  async editDomainById(id: ObjectId, domain: EditDomainDto, userId: UserID) {
    try {
      const existingDomain = await this.getDomainById(id);

      if (!existingDomain) {
        throw new HttpException(`העולם תוכן לא נמצא`, HttpStatus.NOT_FOUND);
      }

      const classificationSet = new Set(existingDomain.classifications.map((id) => id.toString()));

      const updatedClassifcationSet = new Set(domain.classifications.map((id) => id.toString()));

      classificationSet.forEach((id) => {
        if (!updatedClassifcationSet.has(id)) {
          throw new HttpException("ניתן רק להוסיף סיווגים לעולם תוכן", HttpStatus.BAD_REQUEST);
        }
      });

      const addedClassificationsIds = domain.classifications.filter((id) => !classificationSet.has(id.toString()));

      const addedClassifications = await this.classificationsService.getClassificationsByIds(addedClassificationsIds);

      if (addedClassifications.length !== addedClassificationsIds.length) {
        throw new HttpException("נראה שחלק מהסיווגים שהתווספו אינם קיימים", HttpStatus.NOT_FOUND);
      }

      const updateData = {
        classifications: domain.classifications,
        display_name: domain.display_name,
      };
      const updated = await this.db.collection<Domain>("domains").updateOne(
        { name: existingDomain.name },
        {
          $set: updateData,
        },
      );

      if (updated.acknowledged) {
        await this.openFgaService.writeTuplesBatch(
          this.openFgaService.generateDomainClassificationTuples({
            _id: id,
            classifications: addedClassificationsIds,
          }),
        );
      }

      this.auditingService.insertLegacyAudit({
        user_id: userId,
        operation: OP.Update,
        resource: Resource.Domain,
        status: "success",
        resource_info: {
          id: id.toString(),
          name: existingDomain.name,
        },
        message: "Edited Domain",
        difference: customDiff(
          { classifications: existingDomain.classifications, display_name: existingDomain.display_name } satisfies EditDomainDto,
          updateData satisfies EditDomainDto,
          true,
        ),
      });
    } catch (error) {
      this.auditingService.insertLegacyAudit({
        user_id: userId,
        operation: OP.Update,
        resource: Resource.Domain,
        status: "error",
        resource_info: {
          id: id.toString(),
          name: AUDITING_UNKNOWN,
        },
        message: stringify(error),
        response_error_message: error instanceof HttpException ? error.message : "התרחשה תקלה בעריכת עולם תוכן",
      });

      if (error instanceof HttpException) {
        throw error;
      } else {
        throw new InternalServerErrorException("התרחשה תקלה בעריכת עולם תוכן");
      }
    }
  }

  async getDomainWithClassifications(id: string): Promise<DomainWithClassificationsDto> {
    const [domain] = await this.domainModel.aggregate<DomainWithClassificationsDto>([
      { $match: { not_for_use: { $exists: false }, _id: new ObjectId(id) } },
      {
        $lookup: {
          from: "classifications",
          localField: "classifications",
          foreignField: "_id",
          as: "classifications",
        },
      },
    ]);

    if (!domain) {
      throw new NotFoundException(`Domain with id ${id} was not found`);
    }

    return domain;
  }

  async getDomainsWithClassifications(): Promise<DomainWithClassificationsDto[]> {
    return await this.db
      .collection<Domain>("domains")
      .aggregate<DomainWithClassificationsDto>([
        {
          $match: {
            not_for_use: {
              $exists: false,
            },
          },
        },
        {
          $lookup: {
            from: "classifications",
            localField: "classifications",
            foreignField: "_id",
            as: "classifications",
          },
        },
      ])
      .toArray();
  }

  async getAllUsersFullNamesMap() {
    const applicationUserNames = await this.applicationUserModel.find({}, { first_name: 1, last_name: 1, user_id: 1 }).lean();
    const applicationUsersMap = new Map<string, string>(
      applicationUserNames.map((admin) => [admin.user_id, toFullName(admin, admin.user_id)]),
    );

    return applicationUsersMap;
  }

  async getDomainsExcel(): Promise<unknown> {
    const [domains, usersNamesMap, admins] = await Promise.all([
      this.getDomainsWithClassifications(),
      this.getAllUsersFullNamesMap(),
      this.openFgaService.listUsers({
        object: { type: "platform", id: "global" },
        relation: "admin",
        user_filters: [{ type: "user" }],
      }),
    ]);

    const adminsSet = new Set(admins.users.map((user) => user.object.id));

    const domainsWithAdmins = await Promise.all(
      domains.map(async (domain) => {
        const { users } = await this.getUsersWithRelationOnDomain(
          domain._id.toString(),
          FGADomainRelationConstants.has_any_data_permissions,
        );

        const usersFullNames = users.reduce<string[]>((acc, user) => {
          const userId = user.object.id;

          if (!adminsSet.has(userId)) {
            acc.push(usersNamesMap.get(userId) ?? userId);
          }

          return acc;
        }, []);

        return {
          ...domain,
          usersFullNames,
        };
      }),
    );

    const domainsExcel = domains.map((domain, index) => {
      const classificationsNames = domain.classifications.map(({ name }) => name);
      const domainUsersFullNames = domainsWithAdmins[index]?.usersFullNames ?? [];

      return {
        name: domain.display_name,
        classifications: classificationsNames.join(", "),
        admins: domainUsersFullNames ? domainUsersFullNames.join(", ") : "",
      };
    });

    const domainsExcelFile = this.excelService.convertToExcel(domainsExcel, [
      { name: "name", displayName: "שם עולם תוכן", options: { wch: 18 } },
      { name: "classifications", displayName: "סיווגים", options: { wch: 80 } },
      { name: "admins", displayName: "אחראים", options: { wch: 80 } },
    ]);

    return domainsExcelFile;
  }
  async countUsersWithDomainPermission(domainId: ObjectId): Promise<number> {
    const PIPELINE = [
      {
        $match: {
          // if user has read_all their count is meaningless
          "catalogs.datalake.read_all": false,
          "domains.id": domainId,
        },
      },
      {
        $count: "count",
      },
    ];

    const result = await this.db.collection("users").aggregate<WithId<{ count: number }>>(PIPELINE).toArray();

    return result[0]?.count ?? 0;
  }

  async getClassificationsExposureById(domainId: ObjectId, loggedUserId: LoggedUser["userId"]): Promise<DomainClassificationExposures> {
    const { allowed } = await this.openFgaService.check({
      user: formatFGAObjectId({ type: "user", id: loggedUserId }),
      relation: FGADomainRelationConstants.can_classify_tables,
      object: formatFGAObjectId({ type: "domain", id: domainId.toString() }),
    });

    if (!allowed) {
      throw new ForbiddenException(`User doesn't have permission for domain ${domainId}`);
    }

    const PIPELINE = [
      { $unwind: "$domains" },
      { $unwind: "$domains.classifications" },
      { $match: { "domains.id": domainId, "catalogs.datalake.read_all": false } },
      { $group: { _id: "$domains.classifications", exposure: { $sum: 1 } } },
    ];

    const [exposures, domainExposure] = await Promise.all([
      this.db.collection<User>("users").aggregate<WithId<{ exposure: number }>>(PIPELINE).toArray(),
      this.countUsersWithDomainPermission(domainId),
    ]);

    const domainClassificationExposures: DomainClassificationExposures = {
      classificationExposures: exposures.reduce((acc, { _id, exposure }) => ({ ...acc, [_id.toString()]: exposure }), {}),
      domainExposure,
    };

    return domainClassificationExposures;
  }
}
