import { Injectable, Logger } from "@nestjs/common";
import OpenFgaPortClient, {
  CredentialsMethod,
  FGADomainRelations,
  FGATupleKey,
  PLATFORM_FGA_INSTANCE,
  formatFGAObjectId,
  parseFGAObjectId,
  ListObjectsResponse
} from "@port/openfga-client";
import { ObjectId, WithId } from "mongodb";
import { Domain } from "src/domains/domains.dto";
import { toMongoObjectId } from "src/utils/mongo.utils";
import { ManageShieldRoles } from "./openfga.types";
import { CreateApplicationUserDomainDto, EditApplicationUserDomainDto } from "src/application_users/application_users.interfaces";
import { ROLE_NAMES, RoleName, SHIELD_ROLE_NAME } from "@port/shield-schemas";
import { UserID } from "@port/common-schemas";

@Injectable()
export class OpenFgaService extends OpenFgaPortClient {
  private readonly logger = new Logger(OpenFgaService.name);

  constructor() {
    super({
      apiUrl: process.env.FGA_API_URL,
      storeId: process.env.FGA_STORE_ID,
      authorizationModelId: process.env.FGA_MODEL_ID,
      credentials: {
        method: CredentialsMethod.ApiToken,
        config: {
          token: process.env.FGA_API_TOKEN,
        },
      },
    });
  }

  async isApiUser(userId: UserID) {
    return this.hasRole(userId, SHIELD_ROLE_NAME.api_user);
  }

  static formatDomainClassification(domainId: ObjectId | string, classificationId: ObjectId | string) {
    return `${domainId.toString()}-${classificationId.toString()}`;
  }

  static extractDomainClassification(domain_classication: string) {
    const match = domain_classication.match(/^domain_classification:([^-\s]+)-([^-\s]+)$/);

    const domain = match[1];
    const classification = match[2];

    if (!domain || !classification) return null;
    return { domain, classification };
  }

  async hasRole(loggedUserId: UserID, role: RoleName) {
    const res = await this.listObjects({
      user: formatFGAObjectId({ type: "user", id: loggedUserId }),
      relation: role,
      type: "domain",
    });

    return res.objects.length > 0;
  }

  getClassificationsByDomainID(domains_classifications: string[]) {
    return domains_classifications.reduce<Record<string, ObjectId[]>>((acc, obj) => {
      const result = OpenFgaService.extractDomainClassification(obj);

      if (!result) {
        this.logger.warn(`Invalid domain_classification: ${obj}`);
        return acc;
      }

      const { domain, classification } = result;

      if (!acc[domain]) {
        acc[domain] = [];
      }

      acc[domain]!.push(toMongoObjectId(classification));

      return acc;
    }, {});
  }

  generateDomainTuples(domain: Pick<WithId<Domain>, "_id">): FGATupleKey {
    const domainId = domain._id.toString();
    return { user: PLATFORM_FGA_INSTANCE, relation: "platform", object: formatFGAObjectId({ type: "domain", id: domainId }) };
  }

  generateDomainClassificationTuples(domain: Pick<WithId<Domain>, "_id" | "classifications">): FGATupleKey[] {
    const domainId = domain._id.toString();

    return [
      ...domain.classifications.map<FGATupleKey>((classification) => ({
        user: formatFGAObjectId({ type: "domain", id: domainId }),
        relation: "domain",
        object: formatFGAObjectId({
          type: "domain_classification",
          id: OpenFgaService.formatDomainClassification(domainId, classification),
        }),
      })),
    ];
  }

  async canManageRoleOnAnyDomain(loggedUserId: UserID, relation: ManageShieldRoles): Promise<ListObjectsResponse> {
   return await this.listObjects({
      user: formatFGAObjectId({ type: "user", id: loggedUserId }),
      relation: relation,
      type: "domain",
    });
  }

  generateOnlyDomainsToUserTuples(userId: UserID, domains: Pick<CreateApplicationUserDomainDto, "id" | "roleNames">[]): FGATupleKey[] {
    return domains.flatMap<FGATupleKey>((domain) => {
      return domain.roleNames.flatMap((roleName) => ({
        user: formatFGAObjectId({ type: "user", id: userId }),
        relation: roleName,
        object: formatFGAObjectId({ type: "domain", id: domain.id.toString() }),
      }));
    });
  }

  generateDomainsClassificationsToUserTuples(
    userId: UserID,
    domains: Pick<CreateApplicationUserDomainDto, "id" | "classifications">[],
  ): FGATupleKey[] {
    return domains.flatMap<FGATupleKey>((domain) => [
      ...domain.classifications.map<FGATupleKey>((classification) => ({
        user: formatFGAObjectId({ type: "user", id: userId }),
        relation: "assigner",
        object: formatFGAObjectId({
          type: "domain_classification",
          id: OpenFgaService.formatDomainClassification(domain.id, classification),
        }),
      })),
    ]);
  }

  generateDomainsToUserTuples(userId: UserID, domains: CreateApplicationUserDomainDto[] | EditApplicationUserDomainDto[]): FGATupleKey[] {
    return [...this.generateOnlyDomainsToUserTuples(userId, domains), ...this.generateDomainsClassificationsToUserTuples(userId, domains)];
  }

  async getUserDomainIdsByRelation(userId: UserID, relation: FGADomainRelations) {
    return await this.listObjects({
      user: formatFGAObjectId({ type: "user", id: userId }),
      relation,
      type: "domain",
    }).then(({ objects }) =>
      objects.reduce<ObjectId[]>((acc, id) => {
        const domainId = parseFGAObjectId(id)?.id;
        if (domainId) {
          acc.push(toMongoObjectId(domainId));
        }

        return acc;
      }, []),
    );
  }
}
