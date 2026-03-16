import { getPermissionTablesDiffClient } from "@components/ManageUserPopup/diff.utils";
import {
  DiffByType,
  getDomainsDiff,
  getUserIndicationsDiff,
  SplitedDomainDiff,
  toDiffByType,
  UserIndicationDiff,
} from "@port/shield-utils";
import { FormattedPermissionGroupDataPermissions, FormattedPermissionGroupDomain } from "@types";

const getChangedAttributes = (
  currUserAttributes: FormattedPermissionGroupDataPermissions["attributes"],
  newUserAttributes: FormattedPermissionGroupDataPermissions["attributes"],
) => {
  const changedKeys = new Set(
    getUserIndicationsDiff({
      newUserAttributes: {
        mask: newUserAttributes.mask.value,
        deceased_population: newUserAttributes.deceased_population.value,
      },
      currUserAttributes: {
        mask: currUserAttributes.mask.value,
        deceased_population: currUserAttributes.deceased_population.value,
      },
    }).map(({ kind }) => kind),
  );

  return Object.fromEntries(Object.entries(newUserAttributes).filter(([key]) => changedKeys.has(key as UserIndicationDiff["kind"])));
};

export type DomainDiffClient = SplitedDomainDiff<string, FormattedPermissionGroupDomain, FormattedPermissionGroupDomain>;

const getDomainsDiffClient = (
  currDomains: FormattedPermissionGroupDomain[],
  newDomains: FormattedPermissionGroupDomain[],
): DiffByType<DomainDiffClient> => {
  const diffs = getDomainsDiff<string, (typeof currDomains)[number], (typeof newDomains)[number], true>(currDomains, newDomains, {
    splitClassifications: true,
    returnDeletedClassifications: true,
    idhashFunc: (id) => id,
    classificationIdGetter: (classification) => classification._id,
  });

  return toDiffByType(diffs);
};

export const calcPermissionGroupDataPermissionsDiff = (
  currPermissionGroup: FormattedPermissionGroupDataPermissions,
  newPermissionGroup: FormattedPermissionGroupDataPermissions,
) => {
  const changedAttributes = getChangedAttributes(currPermissionGroup.attributes, newPermissionGroup.attributes);
  const domainsDiff = getDomainsDiffClient(currPermissionGroup.domains, newPermissionGroup.domains);
  const permissionTablesDiff = getPermissionTablesDiffClient(currPermissionGroup.permission_tables, newPermissionGroup.permission_tables);

  return {
    changedAttributes,
    domainsDiff,
    permissionTablesDiff,
  };
};
