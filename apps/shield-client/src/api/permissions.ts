import axios from "axios";
import { PERMISSIONS_ENDPOINT, PERMISSIONS_EXCEL_ENDPOINT } from "../constants";
import { Permission } from "../types";
import { EXCEL_ACCEPT_HEADER } from "@constants/excel";

export const getPermissions = async () => {
  const { data } = await axios.get(PERMISSIONS_ENDPOINT);
  const permissions: Permission[] = data;
  return permissions;
};

export const createPermissions = async (body: { name: string; description: string; related_domains: string[] }) => {
  const response = await axios.post(`${PERMISSIONS_ENDPOINT}/create`, body);
  return response;
};

export const editPermissions = async (
  id: string,
  body: {
    name: string;
    description: string | undefined;
  },
) => {
  const response = await axios.put(`${PERMISSIONS_ENDPOINT}/id/${id}`, body);
  return response;
};

export const getPermissionsExcel = async () => {
  const { data } = await axios.get(PERMISSIONS_EXCEL_ENDPOINT, {
    responseType: "blob",
    headers: EXCEL_ACCEPT_HEADER,
  });

  return data;
};
