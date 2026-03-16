import { ObjectIdBrand } from "@port/shield-schemas";
import { Permission } from "./permissions_types";

export interface Domain {
  _id: ObjectIdBrand;
  name: string;
  display_name: string;
  classifications: ObjectIdBrand[];
}

export interface DomainDictionary {
  [key: string]: Pick<Domain, "_id" | "display_name" | "name"> & {
    classifications: Omit<Permission, "related_domains">[];
  };
}

export type CreateDomainDto = Pick<Domain, "name" | "display_name" | "classifications">;
export type EditDomainDto = Pick<Domain, "display_name" | "classifications">;

export type DomainWithClassification = Omit<Domain, "classifications"> & { classifications: Omit<Permission, "related_domains">[] };

export type DomainLogin = Pick<Domain, "_id" | "classifications" | "display_name">;

export interface DomainClassificationExposures {
  classificationExposures: Record<string, number>;
  domainExposure: number;
}
