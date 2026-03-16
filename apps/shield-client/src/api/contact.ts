import { CONACT_US_ENDPOINT, GET_CONTACT_TYPES_ENDPOINT } from "@constants/index";
import { useQuery } from "@tanstack/react-query";
import { RequestType } from "../types/contact.models";
import axios from "axios";

export const contactUs = async (contactRequest: FormData) => {
  const { data } = await axios.post(CONACT_US_ENDPOINT, contactRequest, { headers: { "Content-Type": "multipart/form-data" } });

  return data;
};

const getContactType = async () => {
  const { data } = await axios.get<RequestType[]>(GET_CONTACT_TYPES_ENDPOINT);

  return data;
};

export const useGetRequestTypes = () => {
  return useQuery({
    queryFn: getContactType,
    queryKey: GET_CONTACT_TYPES_ENDPOINT.split("/"),
    meta: {
      loading: false,
    },
  });
};
