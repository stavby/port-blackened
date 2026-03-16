import { MergedClientUser } from "@types";

export const toFullName = ({ first_name, last_name }: Pick<MergedClientUser, "first_name" | "last_name">, defaultValue = ""): string =>
  first_name && last_name ? `${first_name} ${last_name}` : defaultValue;
