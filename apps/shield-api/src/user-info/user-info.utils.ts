import { GetUserInfoDto } from "./user-info.interface";

export const toFullName = ({ first_name, last_name }: Pick<GetUserInfoDto, "first_name" | "last_name">, defaultValue = ""): string =>
  first_name && last_name ? `${first_name} ${last_name}` : defaultValue;
