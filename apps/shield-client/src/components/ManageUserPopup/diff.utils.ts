import {
  calcSymetricDiff,
  DiffByType,
  DiffResult,
  getDomainsDiff,
  getPermissionTablesDiff,
  getUserAttributesDiff,
  SplitedDomainDiff,
  toDiffByType,
  UserAttributesDiff,
} from "@port/shield-utils";
import { MergedClientUser, UserDomain, UserPermissionTable, UserRowFilter, UserRowFilterValue } from "@types";
import { INITIAL_EMPTY_USER } from "./UserInfo/constants";

export const getChangedAttributes = (
  currUserAttributes: MergedClientUser["attributes"],
  newUserAttributes: MergedClientUser["attributes"],
) => {
  const changedKeys = new Set(
    getUserAttributesDiff({
      newUserAttributes: {
        ...newUserAttributes,
        mask: newUserAttributes.mask.value,
        deceased_population: newUserAttributes.deceased_population.value,
      },
      currUserAttributes: {
        ...currUserAttributes,
        mask: currUserAttributes.mask.value,
        deceased_population: currUserAttributes.deceased_population.value,
      },
    }).map(({ kind }) => kind),
  );

  return Object.fromEntries(Object.entries(newUserAttributes).filter(([key]) => changedKeys.has(key as UserAttributesDiff["kind"])));
};

export type DomainDiffClient = SplitedDomainDiff<string, UserDomain, UserDomain>;

export const getDomainsDiffClient = (
  currDomains: MergedClientUser["domains"],
  newDomains: MergedClientUser["domains"],
): DiffByType<DomainDiffClient> => {
  const diffs = getDomainsDiff<string, (typeof currDomains)[number], (typeof newDomains)[number], true>(currDomains, newDomains, {
    splitClassifications: true,
    returnDeletedClassifications: true,
    idhashFunc: (id) => id,
    classificationIdGetter: (classification) => classification._id,
  });

  return toDiffByType(diffs);
};

export type FormattedRowFilter = Pick<UserRowFilter, "kod" | "display_name"> & {
  newValues: UserRowFilterValue[];
  deletedValues?: UserRowFilterValue[];
};

export type FormattedPermissionTable = Omit<UserPermissionTable, "row_filters"> & {
  row_filters: FormattedRowFilter[];
};

export type PermissionTableDiff = DiffResult<FormattedPermissionTable, FormattedPermissionTable, FormattedPermissionTable>;

export const getPermissionTablesDiffClient = (
  currPermissions: MergedClientUser["permission_tables"],
  newPermissions: MergedClientUser["permission_tables"],
): DiffByType<PermissionTableDiff> => {
  const diffs = getPermissionTablesDiff<string, (typeof currPermissions)[number], (typeof newPermissions)[number]>(
    currPermissions,
    newPermissions,
    (id) => id,
  );

  return toDiffByType(diffs);
};

export type PermissionGroupDiff = {
  newPermissionGroups: MergedClientUser["permission_groups"];
  deletedPermissionGroups: MergedClientUser["permission_groups"];
};

export const calcUserDiff = (currUser: MergedClientUser, newUser: MergedClientUser) => {
  const changedAttributes =
    currUser._id === INITIAL_EMPTY_USER._id ? currUser.attributes : getChangedAttributes(currUser.attributes, newUser.attributes);
  const domainsDiff = getDomainsDiffClient(currUser.domains, newUser.domains);
  const permissionTablesDiff = getPermissionTablesDiffClient(currUser.permission_tables, newUser.permission_tables);

  const [deletedPermissionGroups, newPermissionGroups] = calcSymetricDiff(
    currUser.permission_groups,
    newUser.permission_groups,
    (group) => group._id,
  );

  const permissionsGroupsDiff: PermissionGroupDiff = { deletedPermissionGroups, newPermissionGroups };

  const readAllDiff = currUser.is_read_all !== newUser.is_read_all;

  return {
    changedAttributes,
    domainsDiff,
    permissionTablesDiff,
    permissionsGroupsDiff,
    ...(readAllDiff ? { readAllDiff } : {}),
  };
};
