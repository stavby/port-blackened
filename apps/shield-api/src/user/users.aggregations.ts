import { PipelineStage } from "mongoose";
import { UserDomain, UserPermissionTable } from "./user.classes";
import { writeFileSync } from "fs";

export const permissionModifierDataAggregation = (
  path: `${string}.${Extract<keyof UserDomain & keyof UserPermissionTable, "given_by" | "last_changed_by">}`,
) => {
  return [
    // For each resource get info of permission user from application_users collection
    {
      $lookup: {
        from: "application_users",
        localField: path,
        foreignField: "user_id",
        pipeline: [
          {
            $project: {
              user_id: 1,
              domains: 1,
              _id: 0,
            },
          },
        ],
        as: "permission_modifier_data",
      },
    },
    {
      $unwind: {
        path: "$permission_modifier_data",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $set: {
        [`permission_modifier_data.roles`]: {
          $reduce: {
            input: `$permission_modifier_data.domains`,
            initialValue: [],
            in: {
              $setUnion: ["$$value", "$$this.roles"],
            },
          },
        },
      },
    },
    {
      $unset: "permission_modifier_data.domains",
    },
    {
      $lookup: {
        from: "roles",
        localField: "permission_modifier_data.roles",
        foreignField: "_id",
        pipeline: [
          {
            $project: {
              name: 1,
              _id: 1,
            },
          },
        ],
        as: "permission_modifier_data.roles",
      },
    },
    {
      $set: {
        [path]: {
          $cond: [
            { $eq: [{ $ifNull: [`$${path}`, null] }, null] },
            "$$REMOVE",
            {
              $cond: [
                { $ifNull: ["$permission_modifier_data.user_id", false] },
                "$permission_modifier_data",
                {
                  user_id: `$${path}`,
                  roles: [],
                },
              ],
            },
          ],
        },
      },
    },
    {
      $unset: "permission_modifier_data",
    },
  ];
};

/**
 * Important: unwinds domains but does not regroup
 */
export const GET_DATA_PERMISSIONS_FULL_DOMAINS = (domainsPath: string) =>
  [
    {
      $unwind: {
        path: `$${domainsPath}`,
        preserveNullAndEmptyArrays: true,
      },
    },
    // For each domain, get classification name and id
    {
      $lookup: {
        from: "classifications",
        localField: `${domainsPath}.classifications`,
        foreignField: "_id",
        pipeline: [
          {
            $project: {
              _id: 1,
              name: 1,
            },
          },
        ],
        as: `${domainsPath}.classifications`,
      },
    },
    // For each domain, get its display name and save it as domain_data
    {
      $lookup: {
        from: "domains",
        localField: `${domainsPath}.id`,
        foreignField: "_id",
        pipeline: [
          {
            $project: {
              display_name: 1,
              name: 1,
              _id: 0,
            },
          },
        ],
        as: "domain_data",
      },
    },
    {
      $unwind: {
        path: "$domain_data",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $addFields: {
        [`${domainsPath}.display_name`]: "$domain_data.display_name",
        [`${domainsPath}.name`]: "$domain_data.name",
      },
    },
    {
      $unset: "domain_data",
    },
  ] as const satisfies PipelineStage[];

/**
 * Important: unwinds permission groups but does not regroup
 */
export const GET_DATA_PERMISSIONS_FULL_PERMISSION_TABLES = (permissionTablesPath: string) =>
  [
    {
      $unwind: {
        path: `$${permissionTablesPath}`,
        preserveNullAndEmptyArrays: true,
      },
    },
    // For each permission_table, get its display name and save it as permission_table_data
    {
      $lookup: {
        from: "permission_tables",
        localField: `${permissionTablesPath}.id`,
        foreignField: "_id",
        pipeline: [
          {
            $project: {
              name: 1,
              display_name: 1,
              permission_keys: 1,
              row_filters: 1,
              _id: 0,
            },
          },
        ],
        as: "permission_table_data",
      },
    },
    {
      $unwind: {
        path: "$permission_table_data",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $addFields: {
        [`${permissionTablesPath}.name`]: "$permission_table_data.name",
        [`${permissionTablesPath}.display_name`]: "$permission_table_data.display_name",
        [`${permissionTablesPath}.permission_keys`]: "$permission_table_data.permission_keys",
      },
    },
    {
      $set: {
        [`${permissionTablesPath}.row_filters`]: {
          $map: {
            input: "$permission_table_data.row_filters",
            as: "row_filter_data",
            in: {
              kod: "$$row_filter_data.kod",
              display_name: "$$row_filter_data.display_name",
              type: "$$row_filter_data.type",
              query_builder_type: "$$row_filter_data.query_builder_type",
              values: {
                $let: {
                  vars: {
                    // Define a var that will store the values from row_filters if they exist
                    matchedRowFilter: {
                      $arrayElemAt: [
                        {
                          $filter: {
                            input: `$${permissionTablesPath}.row_filters`,
                            as: "row_filter",
                            cond: {
                              $eq: ["$$row_filter_data.kod", "$$row_filter.kod"],
                            },
                          },
                        },
                        0,
                      ],
                    },
                  },
                  // If values doesn't exist, store an empty array
                  in: {
                    $ifNull: ["$$matchedRowFilter.values", []],
                  },
                },
              },
            },
          },
        },
      },
    },
    {
      $unset: "permission_table_data",
    },
  ] as const satisfies PipelineStage[];

const GET_USERS_WITH_FULL_DATA_GROUP = {
  _id: "$_id",
  user_id: {
    $first: "$user_id",
  },
  first_name: {
    $first: "$first_name",
  },
  last_name: {
    $first: "$last_name",
  },
  attributes: {
    $first: "$attributes",
  },
  domains: {
    $first: "$domains",
  },
  permission_tables: {
    $first: "$permission_tables",
  },
  permission_groups: {
    $first: "$permission_groups",
  },
  is_read_all: {
    $first: "$is_read_all",
  },
} as const satisfies PipelineStage.Group["$group"];

export const GET_USERS_WITH_FULL_DATA = [
  {
    $match: {
      "catalogs.datalake": { $exists: true },
    },
  },
  {
    $addFields: {
      hasNoDomains: { $eq: ["$domains", []] },
      hasNoPermissionTables: { $eq: ["$permission_tables", []] },
      is_read_all: "$catalogs.datalake.read_all",
    },
  },
  ...GET_DATA_PERMISSIONS_FULL_DOMAINS("domains"),
  ...permissionModifierDataAggregation("domains.given_by"),
  ...permissionModifierDataAggregation("domains.last_changed_by"),
  // Revert domains unwind
  {
    $group: {
      ...GET_USERS_WITH_FULL_DATA_GROUP,
      hasNoDomains: {
        $first: "$hasNoDomains",
      },
      hasNoPermissionTables: {
        $first: "$hasNoPermissionTables",
      },
      domains: {
        $push: "$domains",
      },
    },
  },
  ...GET_DATA_PERMISSIONS_FULL_PERMISSION_TABLES("permission_tables"),
  // Revert permission_tables unwind
  {
    $group: {
      ...GET_USERS_WITH_FULL_DATA_GROUP,
      hasNoDomains: {
        $first: "$hasNoDomains",
      },
      hasNoPermissionTables: {
        $first: "$hasNoPermissionTables",
      },
      permission_tables: {
        $push: "$permission_tables",
      },
    },
  },
  // Replace domains and permission_tables back to empty array if their hasNo flag is true
  {
    $addFields: {
      domains: {
        $cond: {
          if: "$hasNoDomains",
          then: [],
          else: "$domains",
        },
      },
      permission_tables: {
        $cond: {
          if: "$hasNoPermissionTables",
          then: [],
          else: "$permission_tables",
        },
      },
    },
  },
  {
    $addFields: { hasNoPermissionGroups: { $eq: ["$permission_groups", []] } },
  },
  {
    $unwind: {
      path: "$permission_groups",
      preserveNullAndEmptyArrays: true,
    },
  },
  {
    $lookup: {
      from: "permission_groups",
      localField: "permission_groups.id",
      foreignField: "_id",
      as: "permission_group_data",
    },
  },
  {
    $unwind: {
      path: "$permission_group_data",
      preserveNullAndEmptyArrays: true,
    },
  },
  {
    $addFields: {
      "permission_groups._id": "$permission_group_data._id",
      "permission_groups.name": "$permission_group_data.name",
      "permission_groups.color": "$permission_group_data.color",
      "permission_groups.attributes": "$permission_group_data.attributes",
      "permission_groups.domains": "$permission_group_data.domains",
      "permission_groups.permission_tables": "$permission_group_data.permission_tables",
    },
  },
  {
    $unset: ["permission_group_data", "permission_groups.id"],
  },
  {
    $addFields: {
      groupHasNoPermissionTables: {
        $eq: ["$permission_groups.permission_tables", []],
      },
      groupHasNoDomains: { $eq: ["$permission_groups.domains", []] },
    },
  },
  ...GET_DATA_PERMISSIONS_FULL_DOMAINS("permission_groups.domains"),
  ...permissionModifierDataAggregation("permission_groups.domains.given_by"),
  ...permissionModifierDataAggregation("permission_groups.domains.last_changed_by"),
  {
    $group: {
      ...GET_USERS_WITH_FULL_DATA_GROUP,
      _id: {
        docId: "$_id",
        permissionGroupId: "$permission_groups._id",
      },
      groupHasNoPermissionTables: {
        $first: "$groupHasNoPermissionTables",
      },
      groupHasNoDomains: {
        $first: "$groupHasNoDomains",
      },
      hasNoPermissionGroups: {
        $first: "$hasNoPermissionGroups",
      },
      permission_group_domains: {
        $push: "$permission_groups.domains",
      },
      permission_group: {
        $first: "$permission_groups",
      },
    },
  },
  {
    $set: {
      "permission_group.domains": {
        $cond: {
          if: "$groupHasNoDomains",
          then: [],
          else: "$permission_group_domains",
        },
      },
    },
  },
  ...GET_DATA_PERMISSIONS_FULL_PERMISSION_TABLES("permission_group.permission_tables"),
  {
    $group: {
      ...GET_USERS_WITH_FULL_DATA_GROUP,
      _id: {
        docId: "$_id.docId",
        permissionGroupId: "$permission_group._id",
      },
      groupHasNoPermissionTables: {
        $first: "$groupHasNoPermissionTables",
      },
      groupHasNoDomains: {
        $first: "$groupHasNoDomains",
      },
      hasNoPermissionGroups: {
        $first: "$hasNoPermissionGroups",
      },
      permission_group_permission_tables: {
        $push: "$permission_group.permission_tables",
      },
      permission_group: {
        $first: "$permission_group",
      },
    },
  },
  {
    $set: {
      "permission_group.permission_tables": {
        $cond: {
          if: "$groupHasNoPermissionTables",
          then: [],
          else: "$permission_group_permission_tables",
        },
      },
    },
  },
  {
    $group: {
      ...GET_USERS_WITH_FULL_DATA_GROUP,
      _id: "$_id.docId",
      domains: {
        $first: "$domains",
      },
      permission_tables: {
        $first: "$permission_tables",
      },
      hasNoPermissionGroups: {
        $first: "$hasNoPermissionGroups",
      },
      permission_groups: {
        $push: {
          _id: "$_id.permissionGroupId",
          given_by: "$permission_group.given_by",
          registration_date: "$permission_group.registration_date",
          name: "$permission_group.name",
          color: "$permission_group.color",
          permission_tables: "$permission_group.permission_tables",
          domains: "$permission_group.domains",
          attributes: "$permission_group.attributes",
        },
      },
    },
  },
  {
    $set: {
      permission_groups: {
        $cond: {
          if: "$hasNoPermissionGroups",
          then: [],
          else: "$permission_groups",
        },
      },
    },
  },
  {
    $lookup: {
      from: "sap_permitted_users",
      localField: "user_id",
      foreignField: "user_id",
      as: "sap_permitted_lookup",
    },
  },
  {
    $addFields: {
      is_sap_permitted: { $gt: [{ $size: "$sap_permitted_lookup" }, 0] },
    },
  },
  {
    $unset: "sap_permitted_lookup",
  },
  {
    $project: {
      user_id: 1,
      first_name: 1,
      last_name: 1,
      attributes: {
        deceased_population: {
          $ifNull: ["$attributes.deceased_population", false],
        },
        unique_population: 1,
        mask: 1,
        type: 1,
      },
      permission_tables: 1,
      domains: {
        $sortArray: {
          input: "$domains",
          sortBy: { last_change: -1 },
        },
      },
      is_sap_permitted: 1,
      permission_groups: 1,
      is_read_all: 1,
    },
  },
];

export const OBFUSCATE_UNIQUE_POPULATIONS = [{ $set: { "attributes.unique_population": [] } }] as const satisfies PipelineStage[];
