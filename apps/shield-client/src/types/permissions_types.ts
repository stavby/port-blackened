import { ObjectIdBrand } from "@port/shield-schemas";

export type Permission = {
  _id: ObjectIdBrand;
  name: string;
  description?: string;
  related_domains?: {
    _id: string;
    display_name: string;
  }[];
};
