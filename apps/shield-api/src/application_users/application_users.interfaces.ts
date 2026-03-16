import { NonAdminRoleName, RoleName } from "@port/shield-schemas";
import {
  ApplicationUser as MongooseApplicationUser,
  ApplicationUserDomain as MongooseApplicationUserDomain,
  Domain as MongooseDomain,
  Role as MongooseRole,
} from "@port/shield-models";
import { ObjectId, WithId } from "mongodb";
import { ZCreateApplicationUserDto, ZEditApplicationUserDto, ZGetApplicationUserDto } from "./application_users.classes";
import { DiffResult } from "@port/shield-utils";
import { UserID } from "@port/common-schemas";

export interface OpenFgaFormattedUserDomain {
  id: ObjectId;
  roleNames: NonAdminRoleName[];
  classifications: ObjectId[];
}

export interface OpenFgaFormattedUser {
  userId: UserID;
  domains: OpenFgaFormattedUserDomain[];
  isAdmin: boolean;
  canCreateConnections: boolean;
  canManageUniquePopulationIndications: boolean;
}

export type OpenFgaFormattedUserDomainWithRoleIds = Omit<OpenFgaFormattedUserDomain, "roleNames"> & {
  roles: { id: ObjectId; name: NonAdminRoleName }[];
};

export interface OpenFgaFormattedUserWithRoleIds extends Omit<OpenFgaFormattedUser, "domains"> {
  domains: OpenFgaFormattedUserDomainWithRoleIds[];
}

export interface DomainWithOwners {
  _id: ObjectId;
  display_name: string;
  owners: string[];
}

export interface ApplicationUserData {
  _id: ObjectId;
  domains: (Pick<MongooseApplicationUserDomain, "id"> &
    Pick<MongooseDomain, "name" | "display_name"> & { roles: WithId<MongooseRole>[] })[];
  userId: MongooseApplicationUser["user_id"];
  fullName: string;
  createDate: MongooseApplicationUser["create_date"];
  isAdmin: MongooseApplicationUser["is_admin"];
  canCreateConnections: MongooseApplicationUser["can_create_connections"];
  canManageUniquePopulationIndications: MongooseApplicationUser["can_manage_unique_population_indications"];
}

export type ApplicationUserDomainDiff = {
  id: ObjectId;
  newClassifications: ObjectId[];
  deletedClassifications: ObjectId[];
  deletedRoles: OpenFgaFormattedUserDomainWithRoleIds["roles"];
  newRoles: OpenFgaFormattedUserDomainWithRoleIds["roles"];
};

export type ApplicationUserDomainDiffResult = DiffResult<ApplicationUserDomainDiff, ApplicationUserDomainDiff, ApplicationUserDomainDiff>;
export type CreateApplicationUserDomainDto = ZCreateApplicationUserDto["domains"][number];
export type EditApplicationUserDomainDto = ZEditApplicationUserDto["domains"][number];
export type GetApplicationUserDomainDto = ZGetApplicationUserDto["domains"][number];
