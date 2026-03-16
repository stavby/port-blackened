import { ObjectIdBrand } from "@port/shield-schemas";

export type Role = {
  _id: ObjectIdBrand;
  name: string;
  display_name: string;
  color: string;
};
