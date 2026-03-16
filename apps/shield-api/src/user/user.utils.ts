import { UserDomain } from "@port/shield-models";
import {
  getDomainsDiff,
  getPermissionTablesDiff,
  mergeAttributesWithGroups,
  mergeDomainsWithGroups,
  mergePermissionTablesWithGroups,
} from "@port/shield-utils";
import mongoose from "mongoose";
import { UserPermissionTable } from "./user.classes";
import { PermissionTableDiffServer } from "./user.interfaces";
import { ReplaceFuncWithObjectIdString } from "src/utils/mongo.utils";

export const getDomainsDiffServer = <
  CurrDomain extends Pick<UserDomain, "id" | "classifications">,
  NewDomain extends Pick<UserDomain, "id" | "classifications">,
  S extends boolean,
>(
  currDomains: CurrDomain[],
  newDomains: NewDomain[],
  options: {
    splitClassifications: S;
    returnDeletedClassifications: boolean;
  },
) => {
  return getDomainsDiff<mongoose.Types.ObjectId, CurrDomain, NewDomain, S>(currDomains, newDomains, {
    ...options,
    idhashFunc: (id) => id.toHexString(),
    classificationIdGetter: (classification) => classification,
  });
};

export const getPermissionTablesDiffServer = (
  currPermissionTables: Pick<UserPermissionTable, "id" | "row_filters">[],
  newPermissionTables: Pick<UserPermissionTable, "id" | "row_filters">[],
): PermissionTableDiffServer[] => {
  return getPermissionTablesDiff<mongoose.Types.ObjectId, (typeof currPermissionTables)[number], (typeof newPermissionTables)[number]>(
    currPermissionTables,
    newPermissionTables,
    (id) => id.toHexString(),
  );
};

export const mergeDomainsWithGroupsServer = mergeDomainsWithGroups as unknown as ReplaceFuncWithObjectIdString<
  typeof mergeDomainsWithGroups
>;

export const mergePermissionTablesWithGroupsServer = mergePermissionTablesWithGroups as unknown as ReplaceFuncWithObjectIdString<
  typeof mergePermissionTablesWithGroups
>;

export const mergeAttributesWithGroupsServer = mergeAttributesWithGroups as unknown as ReplaceFuncWithObjectIdString<
  typeof mergeAttributesWithGroups
>;
