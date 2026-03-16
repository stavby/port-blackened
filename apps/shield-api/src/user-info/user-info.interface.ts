import { PreferredUsername, UserID } from "@port/common-schemas";

export class GetUserInfoDto {
  user_id: UserID;
  preferred_username: PreferredUsername;
  first_name?: string;
  last_name?: string;
}

export class GetFullUserInfoDto extends GetUserInfoDto {
  shem_yechida?: string;
  shem_darga?: string;
  shem_sug_sherut?: string;
  cell_phone?: string;
  tatash_date?: Date;
  sabat?: number;
  shem_isuk?: string;
}
