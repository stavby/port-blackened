import { ObjectId } from "mongodb";

export interface PermissionGroupDiff {
  newPermissionGroups: ObjectId[];
  deletedPermissionGroups: ObjectId[];
}
