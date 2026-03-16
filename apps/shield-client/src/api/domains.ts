import {
  DOMAINS_DICTIONARY_ENDPOINT,
  DOMAINS_ENDPOINT,
  DOMAINS_EXCEL_ENDPOINT,
  DOMAINS_WITH_CLASSIFICATIONS_ENDPOINT,
  DOMAIN_BY_ID_ENDPOINT,
  DOMAIN_BY_ID_WITH_CLASSIFICATIONS_ENDPOINT,
  DOMAIN_CLASSIFICATIONS_ENDPOINT,
  DOMAIN_CLASSIFICATION_EXPOSURES_ENDPOINT,
  GET_ALL_DOMAINS_ENDPOINT,
  GET_DOMAINS_MANAGE_ENDPOINT,
} from "@constants";
import { Domain, GetDomainClassificationsApiResponse } from "@types";
import { CreateDomainDto, DomainClassificationExposures, DomainDictionary, EditDomainDto } from "../types/domain";
import { type DomainWithClassificationsDto } from "@port/shield-schemas";

import axios from "axios";
import { EXCEL_ACCEPT_HEADER } from "@constants/excel";
import { useQuery } from "@tanstack/react-query";

export const getDomainsDictionary = async (): Promise<DomainDictionary> => {
  const { data } = await axios.get(DOMAINS_DICTIONARY_ENDPOINT);
  const domains: DomainDictionary = data;
  return domains;
};

export const getAllDomains = async (): Promise<Domain[]> => {
  const { data } = await axios.get<Domain[]>(GET_ALL_DOMAINS_ENDPOINT);

  return data;
};

export const getDomainsManage = async (): Promise<Domain[]> => {
  const { data } = await axios.get<Domain[]>(GET_DOMAINS_MANAGE_ENDPOINT);

  return data;
};

export const useDomainsManage = () => {
  return useQuery({
    queryKey: [DOMAINS_ENDPOINT, "manage-users"],
    queryFn: () => getDomainsManage(),
  });
};

export const getDomainById = async (id: string) => {
  const { data } = await axios.get(DOMAIN_BY_ID_ENDPOINT(id));
  const domains: Domain = data;
  return domains;
};

export const getDomainClassifications = async (id: string) => {
  const { data } = await axios.get<GetDomainClassificationsApiResponse>(DOMAIN_CLASSIFICATIONS_ENDPOINT(id));

  return data;
};

export const getDomainsWithClassifications = async (): Promise<DomainWithClassificationsDto[]> => {
  const { data } = await axios.get(DOMAINS_WITH_CLASSIFICATIONS_ENDPOINT);

  return data as DomainWithClassificationsDto[];
};

export const getDomainWithClassifications = async (id: string): Promise<DomainWithClassificationsDto> => {
  const { data } = await axios.get(DOMAIN_BY_ID_WITH_CLASSIFICATIONS_ENDPOINT(id));

  return data;
};

export const createDomain = async (domain: CreateDomainDto): Promise<void> => {
  await axios.post(DOMAINS_ENDPOINT, domain);
};

export const editDomain = async (id: string, domain: EditDomainDto): Promise<void> => {
  await axios.patch(DOMAIN_BY_ID_ENDPOINT(id), domain);
};

export const getDomainsExcel = async () => {
  const { data } = await axios.get(DOMAINS_EXCEL_ENDPOINT, {
    responseType: "blob",
    headers: EXCEL_ACCEPT_HEADER,
  });

  return data;
};

export const getDomainClassificationExposures = async (id: string): Promise<DomainClassificationExposures> => {
  const { data } = await axios.get(DOMAIN_CLASSIFICATION_EXPOSURES_ENDPOINT(id));

  return data;
};
