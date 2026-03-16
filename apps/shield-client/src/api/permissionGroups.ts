import axios, { AxiosResponse } from "axios";
import {
  DELETE_PERMISSION_GROUP,
  EDIT_PERMISSION_GROUP,
  EDIT_PERMISSION_GROUP_DATA_PERMISSIONS,
  GET_LOGGED_USER_GROUP_PERMISSIONS,
  GET_PERMISSION_GROUP_DATA_PERMISSIONS,
  GET_PERMISSION_GROUPS_DATA_PERMISSIONS,
  GET_MEMBER_EDITABLE_PERMISSION_GROUPS,
  PERMISSION_GROUPS_ENDPOINT,
  PERMISSION_GROUPS_EXCEL_ENDPOINT,
} from "../constants";
import { OverridableQueryOptions } from "../types";
import { EXCEL_ACCEPT_HEADER } from "@constants/excel";
import { useQuery } from "@tanstack/react-query";
import {
  CreatePermissionGroupDto,
  GetLoggedUserGroupPermissionsDto,
  GetPermissionGroupDataPermissionsDto,
  ObjectIdBrand,
  EditPermissionGroupPermissionsDto,
  EditPermissionGroupPermissionsResDto,
  PermissionGroupsDto,
  GetPermissionGroupsDataPermissionsResDto,
  EditPermissionGroupDetailsDto,
} from "@port/shield-schemas";

export const getPermissionGroups = async () => {
  const { data } = await axios.get<Array<PermissionGroupsDto>>(PERMISSION_GROUPS_ENDPOINT);
  return data;
};

export const useGetPermissionGroups = (queryOptions?: OverridableQueryOptions<Array<PermissionGroupsDto>>) => {
  return useQuery({
    queryKey: ["permissionGroups"],
    queryFn: getPermissionGroups,
    meta: {
      loading: false,
    },
    ...queryOptions,
  });
};

export const getPermissionGroupsExcel = async () => {
  const { data } = await axios.get(PERMISSION_GROUPS_EXCEL_ENDPOINT, {
    responseType: "blob",
    headers: EXCEL_ACCEPT_HEADER,
  });

  return data;
};

export const createPermissionGroups = async (body: CreatePermissionGroupDto): Promise<AxiosResponse<string>> => {
  const response = await axios.post(PERMISSION_GROUPS_ENDPOINT, body);

  return response;
};

export const editPermissionGroupDetails = async (id: string, permissionGroupData: EditPermissionGroupDetailsDto) => {
  const response = await axios.put(EDIT_PERMISSION_GROUP(id), permissionGroupData);

  return response;
};

export const editPermissionGroupsDataPermissions = async (
  id: ObjectIdBrand,
  permissionGroupData: EditPermissionGroupPermissionsDto,
): Promise<EditPermissionGroupPermissionsResDto> => {
  const { data } = await axios.put(EDIT_PERMISSION_GROUP_DATA_PERMISSIONS(id), permissionGroupData);

  return data;
};

export const deletePermissionGroups = async (id: string) => {
  const response = await axios.delete(DELETE_PERMISSION_GROUP(id));

  return response;
};

export const getLoggedUserGroupPermissions = async (id: string): Promise<GetLoggedUserGroupPermissionsDto> => {
  const { data } = await axios.get(GET_LOGGED_USER_GROUP_PERMISSIONS(id));
  return data;
};

export const useGetLoggedUserPermissionsOnGroup = (id: string) => {
  return useQuery<GetLoggedUserGroupPermissionsDto>({
    queryKey: ["permissionGroups", id, "roles", "batch"],
    queryFn: async () => await getLoggedUserGroupPermissions(id),
  });
};

export const getMemberEditablePermissionGroups = async (): Promise<string[]> => {
  const { data } = await axios.get(GET_MEMBER_EDITABLE_PERMISSION_GROUPS);
  return data;
};

export const useMemberEditablePermissionGroups = (queryOptions?: OverridableQueryOptions<string[]>) => {
  return useQuery({
    queryKey: ["permissionGroups", "member-editable"],
    queryFn: getMemberEditablePermissionGroups,
    ...queryOptions,
  });
};

export const getPermissionGroupDataPermissions = async (
  permissionGroupId: ObjectIdBrand,
): Promise<GetPermissionGroupDataPermissionsDto> => {
  const { data } = await axios.get(GET_PERMISSION_GROUP_DATA_PERMISSIONS(permissionGroupId));
  return data;
};

export const getPermissionGroupsDataPermissions = async (
  permissionGroupIds: ObjectIdBrand[],
): Promise<GetPermissionGroupsDataPermissionsResDto> => {
  const { data } = await axios.post(GET_PERMISSION_GROUPS_DATA_PERMISSIONS, { permissionGroupIds });
  return data;
};

export const usePermissionGroupDataPermissions = (permissionGroupId: ObjectIdBrand) => {
  return useQuery({
    queryKey: ["permissionGroups", permissionGroupId, "data-permissions"],
    queryFn: () => getPermissionGroupDataPermissions(permissionGroupId),
  });
};
