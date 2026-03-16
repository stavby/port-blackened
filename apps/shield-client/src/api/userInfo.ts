import { GetUserInfoDto, OverridableQueryOptions, FullUserInfo } from "@types";
import axios from "axios";
import { GET_USER_INFO_BY_ID_ENDPOINT, GET_FULL_USER_INFO_BY_ID_ENDPOINT, SEARCH_USERS_ENDPOINT } from "../constants";
import { useQuery } from "@tanstack/react-query";

export const getUserInfoByUserId = async (user_id: string) => {
  const { data } = await axios.get<GetUserInfoDto>(GET_USER_INFO_BY_ID_ENDPOINT(user_id));

  return data;
};

export const getFullUserInfoByUserId = async (id: string) => {
  const { data } = await axios.get<FullUserInfo>(GET_FULL_USER_INFO_BY_ID_ENDPOINT(id));

  return data;
};

export const searchUsers = async (search: string): Promise<GetUserInfoDto[]> => {
  const { data } = await axios.get<GetUserInfoDto[]>(SEARCH_USERS_ENDPOINT(search));

  return data;
};

export const useUserFullInfo = (user_id: string, queryOptions?: OverridableQueryOptions<FullUserInfo>) => {
  return useQuery({
    queryKey: ["user-info", user_id, "full"],
    queryFn: () => getFullUserInfoByUserId(user_id),
    meta: {
      loading: false,
    },
    ...queryOptions,
  });
};
