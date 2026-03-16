import { EXCEL_ACCEPT_HEADER } from "@constants/excel";
import { UserID } from "@port/common-schemas";
import {
  ColumnsDictPreviewDto,
  CreateUserDto,
  GetUserPreviewSchema,
  GetUsersResponseDto,
  ObjectIdBrand,
  PermissionGroup,
  TablePreviewDto,
  UniquePopulationOption,
} from "@port/shield-schemas";
import { StandardTable } from "@port/utils";
import { queryOptions, useMutation, useQuery } from "@tanstack/react-query";
import {
  EditUserDto,
  FilterUsersInput,
  GetUsersByPermissionGroup,
  MergedClientUser,
  OverridableMutationOptions,
  OverridableQueryOptions,
  UserDto,
  UserPermissionTable,
} from "@types";
import axios, { HttpStatusCode } from "axios";
import {
  ADD_PERMISSION_GROUP_TO_USERS,
  CHECK_USERS_EXISTENCE_ENDPOINT,
  CLONE_USERS_ENDPOINT,
  COPY_DOMAIN_TO_USER_ENDPOINT,
  DELETE_PERMISSION_GROUP_TO_USERS,
  DELETE_USER_BY_ID_ENDPOINT,
  DELETE_USER_DOMAIN_ENDPOINT,
  EDIT_USER,
  GET_LIVE_COLUMNS_BY_TABLE_ENDPOINT,
  GET_LIVE_TABLES_BY_USER_ENDPOINT,
  GET_USERS_BY_PERMISSION_GROUP,
  HAS_PERMISSIONS_FOR_DECEASED_POPULATIONS_ENDPOINT,
  HAS_PERMISSIONS_FOR_MASK_ENDPOINT,
  HAS_PERMISSIONS_FOR_UNIQUE_POPULATIONS_ENDPOINT,
  IS_USER_SAP_PERMITTED_BY_USER_ID_ENDPOINT,
  UNIQUE_POPULATION_OPTIONS,
  USERS_ENDPOINT,
  USERS_EXCEL_ENDPOINT,
  USER_BY_USER_ID_ENDPOINT,
  USER_PERMISSION_TABLES_OPTIONS_ENDPOINT,
} from "../constants";

export const getUsers = async (page: number, search?: string, filters?: FilterUsersInput) => {
  const { data } = await axios.post<GetUsersResponseDto>(`${USERS_ENDPOINT}/unblocked`, filters, {
    params: {
      page,
      search,
    },
  });
  return data;
};

export const getUserByUserId = async (userId: string): Promise<UserDto | null> => {
  try {
    const { data } = await axios.get<UserDto>(USER_BY_USER_ID_ENDPOINT(userId));

    return data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === HttpStatusCode.NotFound) {
      return null;
    }

    throw error;
  }
};

export const getIsUserSapPermittedById = async (userId: string): Promise<boolean | null> => {
  try {
    const { data } = await axios.get<boolean>(IS_USER_SAP_PERMITTED_BY_USER_ID_ENDPOINT(userId));

    return data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return null;
    }

    throw error;
  }
};

export const deleteUserById = async (id: string) => {
  const response = await axios.patch(DELETE_USER_BY_ID_ENDPOINT(id));
  return response;
};

export const deleteUserDomainByDomainId = async ({ id, domainId }: { id: ObjectIdBrand; domainId: ObjectIdBrand }): Promise<UserDto> => {
  const response = await axios.delete(DELETE_USER_DOMAIN_ENDPOINT(id, domainId));
  return response.data;
};

export const checkUsersExistence = async (userIds: string[]): Promise<{ [user_id: string]: boolean }> => {
  const { data } = await axios.post(CHECK_USERS_EXISTENCE_ENDPOINT, { userIds });

  return data;
};

export const cloneUsers = async (sourceUserId: string, destinationUserIds: string[]): Promise<void> => {
  await axios.post(CLONE_USERS_ENDPOINT, { sourceUserId, destinationUserIds });
};

export const copyDomainToUser = async (srcUserId: string, dstUserId: string, domainId: string) => {
  const { data } = await axios.put(COPY_DOMAIN_TO_USER_ENDPOINT(srcUserId, dstUserId, domainId));

  const user: MergedClientUser = data;
  return user;
};

export const getPermissionTablesOptions = async (domains: CreateUserDto["domains"]) => {
  const { data } = await axios.post<UserPermissionTable[]>(USER_PERMISSION_TABLES_OPTIONS_ENDPOINT, { domains });

  return data;
};

export const getUsersExcel = async (search: string, filters?: FilterUsersInput) => {
  const { data } = await axios.post(USERS_EXCEL_ENDPOINT, filters, {
    responseType: "blob",
    headers: EXCEL_ACCEPT_HEADER,
    params: { search },
  });

  return data;
};

export const createUser = async (data: CreateUserDto): Promise<UserDto> => {
  const res = await axios.post(USERS_ENDPOINT, data);

  return res.data;
};

export const editUser = async (
  id: MergedClientUser["_id"],
  data: EditUserDto,
): Promise<{ user: UserDto; lockedDomains: EditUserDto["domains"]; lockedPermissionTables: EditUserDto["permission_tables"] }> => {
  const res = await axios.put(EDIT_USER(id), data);

  return res.data;
};

export const hasPermissionsForUniquePopulations = async () => {
  const { data } = await axios.get<boolean>(HAS_PERMISSIONS_FOR_UNIQUE_POPULATIONS_ENDPOINT);

  return data;
};

export const getUniquePopulationOptions = async () => {
  const { data } = await axios.get<UniquePopulationOption[]>(UNIQUE_POPULATION_OPTIONS);

  return data;
};

export const useHasPermissionsForUniquePopulations = (queryOptions?: OverridableQueryOptions<boolean>) => {
  return useQuery({
    queryKey: ["users", "hasPermissionsForUniquePopulations"],
    queryFn: hasPermissionsForUniquePopulations,
    meta: {
      loading: false,
    },
    ...queryOptions,
  });
};

export const useUniquePopulationOptions = (queryOptions?: OverridableQueryOptions<UniquePopulationOption[]>) => {
  return useQuery({
    queryKey: ["users", "uniquePopulationOptions"],
    queryFn: getUniquePopulationOptions,
    meta: { loading: false },
    ...queryOptions,
  });
};

export const hasPermissionsForDeceasedPopulations = async (domainIds: string[]) => {
  const { data } = await axios.post<boolean>(HAS_PERMISSIONS_FOR_DECEASED_POPULATIONS_ENDPOINT, { domainIds });

  return data;
};

export const useHasPermissionsForDeceasedPopulations = (domainIds: string[], queryOptions?: OverridableQueryOptions<boolean>) => {
  return useQuery({
    queryKey: ["users", "hasPermissionsForDeceasedPopulations", domainIds],
    queryFn: () => hasPermissionsForDeceasedPopulations(domainIds),
    meta: {
      loading: false,
    },
    ...queryOptions,
  });
};

export const hasPermissionsForMask = async (domainIds: string[]) => {
  const { data } = await axios.post<boolean>(HAS_PERMISSIONS_FOR_MASK_ENDPOINT, { domainIds });

  return data;
};

export const useHasPermissionsForMask = (domainIds: string[], queryOptions?: OverridableQueryOptions<boolean>) => {
  return useQuery({
    queryKey: ["user", "hasPermissionsForMask", domainIds],
    queryFn: () => hasPermissionsForMask(domainIds),
    meta: {
      loading: false,
    },
    ...queryOptions,
  });
};

export const addPermissionGroupToUsers = async (permissionGroupId: PermissionGroup["_id"], users: string[]) => {
  const { data } = await axios.put(ADD_PERMISSION_GROUP_TO_USERS(permissionGroupId), { users });

  return data;
};

export const useAddPermissionGroupToUsers = (
  mutationOptions?: OverridableMutationOptions<void, { permissionGroupId: PermissionGroup["_id"]; users: string[] }>,
) => {
  return useMutation({
    mutationFn: async ({ permissionGroupId, users }: { permissionGroupId: PermissionGroup["_id"]; users: string[] }): Promise<void> => {
      await addPermissionGroupToUsers(permissionGroupId, users);
    },
    ...mutationOptions,
  });
};

export const getLiveTablesByUser = async (userId: UserID, user_attributes: GetUserPreviewSchema) => {
  const { data } = await axios.post<TablePreviewDto[]>(GET_LIVE_TABLES_BY_USER_ENDPOINT(userId), user_attributes);

  return data;
};

export const useGetLiveTablesByUser = (
  userId: UserID,
  user_attributes: GetUserPreviewSchema,
  queryOptions?: OverridableQueryOptions<TablePreviewDto[]>,
) => {
  return useQuery({
    queryKey: ["user", "liveTablesByUser", userId, user_attributes.data],
    queryFn: () => getLiveTablesByUser(userId, user_attributes),
    meta: {
      loading: false,
    },
    ...queryOptions,
  });
};

export const getUsersByPermissionGroup = async (permissionGroup: string) => {
  const { data } = await axios.get(GET_USERS_BY_PERMISSION_GROUP(permissionGroup));

  return data;
};

export const getUsersByPermissionGroupOptions = (permissionGroup: string) =>
  queryOptions({
    queryKey: ["user", "getUsersByPermissionGroup", permissionGroup],
    queryFn: () => getUsersByPermissionGroup(permissionGroup),
    meta: {
      loading: false,
    },
  });

export const useGetUsersByPermissionGroup = (
  permissionGroup: string,
  queryOptions?: OverridableQueryOptions<GetUsersByPermissionGroup[]>,
) => {
  return useQuery({
    queryKey: ["user", "getUsersByPermissionGroup", permissionGroup],
    queryFn: () => getUsersByPermissionGroup(permissionGroup),
    meta: {
      loading: false,
    },
    ...queryOptions,
  });
};

export const getLiveColumnsByTable = async (userId: string, table: StandardTable, payload?: GetUserPreviewSchema) => {
  const { data } = await axios.post<ColumnsDictPreviewDto>(GET_LIVE_COLUMNS_BY_TABLE_ENDPOINT(userId, table), payload);

  return data;
};

export const useGetLiveColumnsByTable = (
  userId: string,
  table: StandardTable,
  user_attributes: GetUserPreviewSchema,
  queryOptions?: OverridableQueryOptions<ColumnsDictPreviewDto>,
) => {
  return useQuery({
    queryKey: ["user", "liveColumnsByTable", userId, "table", table.tableName, table.tableSchema, user_attributes],
    queryFn: () => getLiveColumnsByTable(userId, table, user_attributes),
    meta: {
      loading: false,
    },
    ...queryOptions,
  });
};

export const deletePermissionGroupToUsers = async (permissionGroupId: string, userObjectId: string) => {
  const { data } = await axios.delete(DELETE_PERMISSION_GROUP_TO_USERS(permissionGroupId, userObjectId));

  return data;
};

export const useDeletePermissionGroupFromUser = (
  mutationOptions?: OverridableMutationOptions<void, { permissionGroupId: PermissionGroup["_id"]; userObjectId: string }>,
) => {
  return useMutation({
    mutationFn: async ({
      permissionGroupId,
      userObjectId,
    }: {
      permissionGroupId: PermissionGroup["_id"];
      userObjectId: string;
    }): Promise<void> => {
      await deletePermissionGroupToUsers(permissionGroupId, userObjectId);
    },
    ...mutationOptions,
  });
};
