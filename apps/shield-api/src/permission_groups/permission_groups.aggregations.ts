import { PipelineStage } from "mongoose";
import { GET_DATA_PERMISSIONS_FULL_DOMAINS, GET_DATA_PERMISSIONS_FULL_PERMISSION_TABLES } from "src/user/users.aggregations";

const GET_PERMISSION_GROUP_DATA_PERMISSIONS_DTO_GROUP = {
  _id: "$_id",
  hasNoDomains: {
    $first: "$hasNoDomains",
  },
  hasNoPermissionTables: {
    $first: "$hasNoPermissionTables",
  },
  name: {
    $first: "$name",
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
} as const satisfies PipelineStage.Group["$group"];

export const GET_PERMISSION_GROUP_DATA_PERMISSIONS_DTO_AGG = [
  { $addFields: { hasNoDomains: { $eq: ["$domains", []] }, hasNoPermissionTables: { $eq: ["$permission_tables", []] } } },
  ...GET_DATA_PERMISSIONS_FULL_DOMAINS("domains"),
  // Revert domains unwind
  {
    $group: {
      ...GET_PERMISSION_GROUP_DATA_PERMISSIONS_DTO_GROUP,
      domains: {
        $push: "$domains",
      },
    },
  },
  ...GET_DATA_PERMISSIONS_FULL_PERMISSION_TABLES("permission_tables"),
  // Revert permission_tables unwind
  {
    $group: {
      ...GET_PERMISSION_GROUP_DATA_PERMISSIONS_DTO_GROUP,
      permission_tables: {
        $push: "$permission_tables",
      },
    },
  },
  // Replace domains and permission_tables back to empty array if their hasNo flag is true
  {
    $set: {
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
    $unset: ["hasNoDomains", "hasNoPermissionTables"],
  },
] as const satisfies PipelineStage[];
