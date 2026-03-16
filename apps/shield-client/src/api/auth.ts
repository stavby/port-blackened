import axios from "axios";
import { USER_INFO_DISPLAY_ENDPOINT, USER_INFO_ENDPOINT } from "../constants";
import { useQuery } from "@tanstack/react-query";
import { GetLoggedUserInfo, GetLoggedUserPermissionsDisplay } from "@port/shield-schemas";

export const getUserInfo = async (): Promise<GetLoggedUserInfo> => {
  const { data } = await axios.get(USER_INFO_ENDPOINT);

  return data;
};

export const getUserInfoDisplay = async (): Promise<GetLoggedUserPermissionsDisplay> => {
  const { data } = await axios.get(USER_INFO_DISPLAY_ENDPOINT);

  return data;
};

export const useLoggedUserInfo = () => {
  return useQuery({
    queryKey: ["userInfo"],
    queryFn: getUserInfo,
  });
};
