import { ASSIGNABLE_ROLES } from "@constants/index";
import { Role } from "@types";
import axios from "axios";

export const getAssignableRoles = async (): Promise<Role[]> => {
  const { data } = await axios.get<Role[]>(ASSIGNABLE_ROLES);

  return data;
};
