import { UserDto } from "@types";
import { AttributeOptions } from "../types";
import { UserID } from "@port/common-schemas";
import { DEFAULT_USER_ATTRIBUTES, ObjectIdBrand } from "@port/shield-schemas";
import { cloneDeep } from "lodash";

export const USER_TYPES_OPTIONS: AttributeOptions[] = [
  {
    key: 'קפ"ט',
    label: 'קפ"ט',
  },
  {
    key: "חוקר",
    label: "חוקר",
  },
  {
    key: "לקוח קצה",
    label: "לקוח קצה",
  },
  {
    key: "מערכת",
    label: "מערכת",
  },
];

export const MASK_OPTIONS: AttributeOptions[] = [
  {
    key: "true",
    label: "עם התממה",
  },
  {
    key: "false",
    label: "ללא התממה",
  },
];

export const DECEASED_POPULATION_OPTIONS: AttributeOptions[] = [
  {
    key: "true",
    label: "אוכלוסיית נפטרים",
  },
  {
    key: "false",
    label: "ללא נפטרים",
  },
];

export const READ_ALL_OPTIONS: AttributeOptions[] = [
  {
    key: "true",
    label: "אלוף",
  },
  {
    key: "false",
    label: "עלוב",
  },
];

export const INITIAL_EMPTY_USER: UserDto = {
  _id: "dummy" as ObjectIdBrand,
  user_id: ".........." as UserID,
  attributes: cloneDeep(DEFAULT_USER_ATTRIBUTES),
  domains: [],
  permission_tables: [],
  is_sap_permitted: false,
  permission_groups: [],
};
