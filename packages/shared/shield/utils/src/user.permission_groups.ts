import { AddPath } from "@port/common-schemas";
import { DEFAULT_USER_ATTRIBUTES, GetUsersResponseDto, ObjectIdBrand, PERMISSION_GROUPS_ATTRIBUTES } from "@port/shield-schemas";

type UserDto = GetUsersResponseDto["users"][number];
type UserDomainDto = UserDto["domains"][number];
type UserPermissionTableDto = UserDto["permission_tables"][number];
type UserPermissionGroupDto = UserDto["permission_groups"][number];

export const DIRECT_PERMISSION_SOURCE = { id: "direct", display_name: "ישיר" } as const satisfies PermissionSource;
export type PermissionSource = { id: "direct" | ObjectIdBrand; display_name: string };
export type PermissionSourceWithAuditMeta = PermissionSource &
  Pick<UserDomainDto, "create_date" | "last_change"> & {
    given_by?: UserDomainDto["given_by"] | string;
    last_changed_by?: UserDomainDto["last_changed_by"] | string;
  };

type MergedUserDomain = AddPath<
  UserDomainDto & { sources: PermissionSourceWithAuditMeta[] },
  ["classifications", number, "sources"],
  PermissionSource[]
>;
type MergedUserPermissionTable = AddPath<UserPermissionTableDto, ["row_filters", number, "values", number, "sources"], PermissionSource[]>;
type MergedAttributes = {
  [K in keyof Pick<UserDto["attributes"], keyof UserPermissionGroupDto["attributes"]>]: {
    value: UserDto["attributes"][K];
    sources: PermissionSource[];
  };
} & Omit<UserDto["attributes"], keyof UserPermissionGroupDto["attributes"]>;

export type MergedUser = Omit<UserDto, "domains" | "permission_tables" | "attributes"> & {
  domains: MergedUserDomain[];
  permission_tables: MergedUserPermissionTable[];
  attributes: MergedAttributes;
};

type WithSource<T extends Record<PropertyKey, unknown>, WithMeta extends boolean = false> = T & {
  source: WithMeta extends true ? PermissionSourceWithAuditMeta : PermissionSource;
};

export const mergeDomainsWithGroups = ({
  domains,
  permission_groups,
}: {
  domains: UserDomainDto[];
  permission_groups: Pick<UserPermissionGroupDto, "_id" | "name" | "domains" | "registration_date">[];
}): MergedUser["domains"] => {
  const domainsMapById = new Map<string, MergedUserDomain>();
  const concatedDomains: WithSource<UserDomainDto, true>[] = [
    ...domains.map<WithSource<UserDomainDto, true>>((domain) => ({
      ...domain,
      source: {
        given_by: domain.given_by,
        create_date: domain.create_date,
        last_changed_by: domain.last_changed_by,
        last_change: domain.last_change,
        ...DIRECT_PERMISSION_SOURCE,
      },
    })),
    ...permission_groups.flatMap<WithSource<UserDomainDto, true>>(({ _id, domains, name, registration_date }) =>
      domains.map((domain) => ({
        ...domain,
        source: {
          given_by: name,
          create_date: registration_date,

          id: _id,
          display_name: name,
        },
      })),
    ),
  ];

  for (const domain of concatedDomains) {
    let targetDomain = domainsMapById.get(domain.id.toString());

    if (!targetDomain) {
      targetDomain = {
        ...domain,
        sources: [domain.source],
        classifications: [],
      };
    } else if (!targetDomain.sources.includes(domain.source)) {
      targetDomain.sources.push(domain.source);
    }

    const classificationsMapById = new Map<string, MergedUserDomain["classifications"][number]>(
      targetDomain.classifications.map((classification) => [classification._id.toString(), classification]),
    );

    for (const classification of domain.classifications) {
      const existing = classificationsMapById.get(classification._id.toString());

      if (!existing) {
        const withSource: MergedUserDomain["classifications"][number] = {
          ...classification,
          sources: [
            {
              id: domain.source.id,
              display_name: domain.source.display_name,
            },
          ],
        };

        classificationsMapById.set(classification._id.toString(), withSource);
      } else if (!existing.sources.includes(domain.source)) {
        classificationsMapById.set(classification._id.toString(), {
          ...existing,
          sources: [
            ...existing.sources,
            {
              id: domain.source.id,
              display_name: domain.source.display_name,
            },
          ],
        });
      }
    }

    targetDomain.classifications = [...classificationsMapById.values()];
    domainsMapById.set(domain.id.toString(), targetDomain);
  }

  return Array.from(domainsMapById.values());
};

export const mergePermissionTablesWithGroups = ({
  permission_tables,
  permission_groups,
}: {
  permission_tables: UserPermissionTableDto[];
  permission_groups: Pick<UserPermissionGroupDto, "_id" | "name" | "permission_tables">[];
}): MergedUserPermissionTable[] => {
  const permissionTablesMapById = new Map<string, MergedUserPermissionTable>();
  const permissionTables: WithSource<UserPermissionTableDto>[] = [
    ...permission_tables.map((permission_table) => ({ ...permission_table, source: DIRECT_PERMISSION_SOURCE })),
    ...permission_groups.flatMap((permission_group) =>
      permission_group.permission_tables.map((permission_table) => ({
        ...permission_table,
        source: { id: permission_table.id, display_name: permission_group.name },
      })),
    ),
  ];

  for (const permissionTable of permissionTables) {
    let targetPermissionTable = permissionTablesMapById.get(permissionTable.id.toString());

    if (!targetPermissionTable) {
      targetPermissionTable = {
        ...permissionTable,
        row_filters: [],
      };
    }

    const rowFilterMapByKod = new Map(targetPermissionTable.row_filters.map((row_filter) => [row_filter.kod, row_filter]));

    for (const row_filter of permissionTable.row_filters) {
      let targetRowFilter = rowFilterMapByKod.get(row_filter.kod);

      if (!targetRowFilter) {
        targetRowFilter = {
          ...row_filter,
          values: [],
        };
      }

      if (row_filter.type === "boolean") {
        const value = row_filter.values[0];
        const isValueTrue = value && value.value === 1;
        const currentValue = targetRowFilter.values[0];
        const isCurrentValueTrue = currentValue && currentValue.value === 1;
        const currentSources = currentValue?.sources ?? [];
        const isTrue = isCurrentValueTrue || isValueTrue;
        targetRowFilter.values = [
          {
            value: isTrue ? 1 : 0,
            display_name: isTrue ? "כן" : "לא",
            sources: isValueTrue ? [...currentSources, permissionTable.source] : currentSources,
          },
        ];
      } else {
        const valuesMap = new Map(targetRowFilter.values.map((value) => [value.value, value]));

        for (const value of row_filter.values) {
          const existing = valuesMap.get(value.value);

          if (!existing) {
            const valueWithSource = {
              ...value,
              sources: [permissionTable.source],
            };

            valuesMap.set(value.value, valueWithSource);
          } else if (!existing.sources.includes(permissionTable.source)) {
            valuesMap.set(value.value, { ...existing, sources: [...existing.sources, permissionTable.source] });
          }
        }

        targetRowFilter.values = [...valuesMap.values()];
      }

      rowFilterMapByKod.set(row_filter.kod, targetRowFilter);
    }

    targetPermissionTable.row_filters = [...rowFilterMapByKod.values()];
    permissionTablesMapById.set(permissionTable.id.toString(), targetPermissionTable);
  }

  return Array.from(permissionTablesMapById.values());
};

export const mergeAttributesWithGroups = ({
  attributes,
  permission_groups,
}: {
  attributes: UserDto["attributes"];
  permission_groups: Pick<UserPermissionGroupDto, "_id" | "name" | "attributes">[];
}): MergedAttributes => {
  const concatedAttributes: [WithSource<UserDto["attributes"]>, ...WithSource<UserPermissionGroupDto["attributes"]>[]] = [
    { ...attributes, source: DIRECT_PERMISSION_SOURCE },
    ...permission_groups.map<WithSource<UserPermissionGroupDto["attributes"]>>(({ attributes, _id, name }) => ({
      ...attributes,
      source: { id: _id, display_name: name },
    })),
  ];

  const mergedAttributes: MergedAttributes = {
    type: attributes.type,
    unique_population: attributes.unique_population,
    blocked: attributes.blocked,
    mask: { value: attributes.mask, sources: [] },
    deceased_population: { value: attributes.deceased_population, sources: [] },
  };

  for (const currentAttributes of concatedAttributes) {
    PERMISSION_GROUPS_ATTRIBUTES.forEach((attribute) => {
      if (currentAttributes[attribute] !== DEFAULT_USER_ATTRIBUTES[attribute]) {
        mergedAttributes[attribute] = {
          value: currentAttributes[attribute],
          sources: [...mergedAttributes[attribute].sources, currentAttributes.source],
        };
      }
    });
  }

  return mergedAttributes;
};
