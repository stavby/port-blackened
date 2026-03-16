export interface TrinoUserInfo {
  mispar_ishi: number;
  shem_male: string;
  kod_yechida: number;
  shem_yechida: string;
  kod_sug_sherut: number;
  shem_sug_sherut: string;
  kod_samchut: number;
  shem_samchut: string;
  kod_chail: number;
  shem_chail: string;
  kod_darga: number;
  shem_darga: string;
  cell_phone: string;
  tatash_date: string;
  sabat: number;
  kod_isuk: number | null;
  shem_isuk: string | null;
}

export interface Column {
  Column: string;
  Type: string;
  Extra: string;
  Comment: string;
}
