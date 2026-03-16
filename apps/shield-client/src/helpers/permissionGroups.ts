import { GetPermissionGroupDataPermissionsDto } from "@port/shield-schemas";
import { DIRECT_PERMISSION_SOURCE } from "@port/shield-utils";
import { FormattedPermissionGroupDataPermissions } from "@types";

export const formatPermissionGroupDataPermissions = (
  dataPermissions: GetPermissionGroupDataPermissionsDto,
): FormattedPermissionGroupDataPermissions => {
  return {
    ...dataPermissions,
    attributes: {
      ...dataPermissions.attributes,
      mask: { value: dataPermissions.attributes.mask, sources: [DIRECT_PERMISSION_SOURCE] },
      deceased_population: { value: dataPermissions.attributes.deceased_population, sources: [DIRECT_PERMISSION_SOURCE] },
    },
    domains: dataPermissions.domains.map((domain) => ({
      ...domain,
      sources: [DIRECT_PERMISSION_SOURCE],
      classifications: domain.classifications.map((classification) => ({ ...classification, sources: [DIRECT_PERMISSION_SOURCE] })),
    })),
    permission_tables: dataPermissions.permission_tables.map((permission_table) => ({
      ...permission_table,
      row_filters: permission_table.row_filters.map((row_filter) => ({
        ...row_filter,
        values: row_filter.values.map((value) => ({
          ...value,
          sources: [DIRECT_PERMISSION_SOURCE],
        })),
      })),
    })),
  };
};
