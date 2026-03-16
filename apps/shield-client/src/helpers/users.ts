import { DEFAULT_USER_ATTRIBUTES, GetUsersResponseDto } from "@port/shield-schemas";
import {
  DIRECT_PERMISSION_SOURCE,
  mergeAttributesWithGroups,
  mergeDomainsWithGroups,
  mergePermissionTablesWithGroups,
} from "@port/shield-utils";
import { QueryClient } from "@tanstack/react-query";
import { FormattedPermissionGroupDataPermissions, MergedClientUser, UserDto } from "@types";

export const isGetUsersResponse = (data: unknown): data is GetUsersResponseDto => {
  return (
    typeof data === "object" &&
    data !== null &&
    "users" in data &&
    Array.isArray(data.users) &&
    "metadata" in data &&
    typeof data.metadata === "object" &&
    Array.isArray(data.metadata) &&
    data.metadata.length === 1 &&
    typeof data.metadata[0].totalCount === "number"
  );
};

export const removeUserFromCache = (queryClient: QueryClient, userId: string) => {
  queryClient.setQueriesData({ queryKey: ["paginatedUsers"] }, (oldData: GetUsersResponseDto) => {
    if (!oldData || !isGetUsersResponse(oldData)) return oldData;
    return {
      ...oldData,
      users: oldData.users.filter(({ user_id }) => user_id !== userId),
    };
  });
};

export const updateUserInCache = (queryClient: QueryClient, updatedUser: UserDto) => {
  queryClient.setQueriesData({ queryKey: ["paginatedUsers", { search: "" }, {}] }, (oldData: GetUsersResponseDto) => {
    if (!oldData || !isGetUsersResponse(oldData)) return oldData;

    return {
      ...oldData,
      users: oldData.users.map((currentUser) => (currentUser._id !== updatedUser._id ? currentUser : updatedUser)),
    };
  });
};

export const mergeUserDto = (user: UserDto): MergedClientUser => {
  return {
    ...user,
    attributes: mergeAttributesWithGroups(user),
    domains: mergeDomainsWithGroups(user),
    permission_tables: mergePermissionTablesWithGroups(user),
    permission_groups: user.permission_groups.map(({ _id, name, color }) => ({
      _id,
      name,
      color,
    })),
  };
};

export const updateBooleanAttributesWithSources = <T extends MergedClientUser | FormattedPermissionGroupDataPermissions>(
  user: T,
  newValue: boolean,
  attribute: keyof FormattedPermissionGroupDataPermissions["attributes"],
): T => {
  const isNonDefault = newValue !== DEFAULT_USER_ATTRIBUTES[attribute];

  return {
    ...user,
    attributes: {
      ...user.attributes,
      [attribute]: {
        value: newValue,
        sources: isNonDefault
          ? [...new Set([...user.attributes[attribute].sources, DIRECT_PERMISSION_SOURCE])]
          : user.attributes[attribute].sources.filter(({ id }) => id !== DIRECT_PERMISSION_SOURCE.id),
      },
    },
  };
};
