import { calcDiff, calcSymetricDiff } from "@port/shield-utils";
import {
  ApplicationUserDomainDiff,
  ApplicationUserDomainDiffResult,
  OpenFgaFormattedUserDomainWithRoleIds,
  OpenFgaFormattedUserWithRoleIds,
} from "./application_users.interfaces";
import { ApplicationUserBooleanAttribute, applicationUserBooleanAttributes } from "@port/shield-schemas";
import { ApplicationUserIndicationDiff } from "@port/shield-models";

export const getApplicationUserDomainsDiff = ({
  currentDomains,
  newDomains,
}: {
  currentDomains: OpenFgaFormattedUserDomainWithRoleIds[];
  newDomains: OpenFgaFormattedUserDomainWithRoleIds[];
}): ApplicationUserDomainDiffResult[] => {
  return calcDiff(currentDomains, newDomains, (currDomain, newDomain) => currDomain.id.equals(newDomain.id), {
    new: (newDomain) => {
      const { classifications, roles, ...rest } = newDomain;

      return {
        ...rest,
        newClassifications: classifications,
        deletedClassifications: [],
        newRoles: roles,
        deletedRoles: [],
      } satisfies ApplicationUserDomainDiff;
    },
    updated: (currDomain, newDomain) => {
      const [newClassifications, deletedClassifications] = calcSymetricDiff(
        newDomain.classifications,
        currDomain.classifications,
        (classification) => classification.toString(),
      );
      const [newRoles, deletedRoles] = calcSymetricDiff(newDomain.roles, currDomain.roles, (role) => role.id.toString());

      const isUpdated =
        newClassifications.length > 0 || deletedClassifications.length > 0 || newRoles.length > 0 || deletedRoles.length > 0;

      if (isUpdated) {
        const { classifications: _classifications, roles: _roles, ...rest } = currDomain;

        return {
          ...rest,
          newClassifications,
          deletedClassifications,
          newRoles: newRoles,
          deletedRoles: deletedRoles,
        } satisfies ApplicationUserDomainDiff;
      }

      return null;
    },
    deleted: (currDomain) => {
      const { classifications, roles, ...rest } = currDomain;

      return {
        ...rest,
        newClassifications: [],
        deletedClassifications: classifications,
        newRoles: [],
        deletedRoles: roles,
      } satisfies ApplicationUserDomainDiff;
    },
  });
};

export const booleanAttributeNameToSnakeCase = {
  isAdmin: "is_admin",
  canCreateConnections: "can_create_connections",
  canManageUniquePopulationIndications: "can_manage_unique_population_indications",
} as const satisfies Record<ApplicationUserBooleanAttribute, ApplicationUserIndicationDiff["kind"]>;

export const booleanAttributeNameToCamelCase = {
  is_admin: "isAdmin",
  can_create_connections: "canCreateConnections",
  can_manage_unique_population_indications: "canManageUniquePopulationIndications",
} as const satisfies Record<ApplicationUserIndicationDiff["kind"], ApplicationUserBooleanAttribute>;

export const getApplicationUserDiff = ({
  currApplicationUser,
  newApplicationUser,
}: {
  currApplicationUser: OpenFgaFormattedUserWithRoleIds;
  newApplicationUser: OpenFgaFormattedUserWithRoleIds;
}) => {
  const domainsDiff = getApplicationUserDomainsDiff({
    currentDomains: currApplicationUser.domains,
    newDomains: newApplicationUser.domains,
  });

  const applicationUserIndicationsDiff: ApplicationUserIndicationDiff[] = [];

  applicationUserBooleanAttributes.forEach((attribute) => {
    if (currApplicationUser[attribute] !== newApplicationUser[attribute]) {
      applicationUserIndicationsDiff.push({
        action_type: newApplicationUser[attribute] === true ? "ON" : "OFF",
        kind: booleanAttributeNameToSnakeCase[attribute],
      });
    }
  });

  return {
    domainsDiff,
    applicationUserIndicationsDiff,
  };
};
