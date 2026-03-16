import { Controller, Get, Param } from "@nestjs/common";
import { QueryData } from "trino-client";
import { TrinoUserInfo } from "./trino.interface";
import { TrinoService } from "./trino.service";

@Controller("trino")
export class TrinoController {
  constructor(private readonly trinoService: TrinoService) {}

  @Get()
  async getClassificationss(): Promise<QueryData[]> {
    return await this.trinoService.runQuery("select * from <redacted> limit 100");
  }

  @Get(":id")
  async getTrinoUserInfo(@Param("id") id: string): Promise<TrinoUserInfo> {
    const userInfo = await this.trinoService.runQuery(`select * from <redacted> where mispar_ishi = ${id}`);

    return {
      mispar_ishi: userInfo[0][0],
      shem_male: userInfo[0][1],
      kod_yechida: userInfo[0][2],
      shem_yechida: userInfo[0][3],
      kod_sug_sherut: userInfo[0][6],
      shem_sug_sherut: userInfo[0][7],
      kod_samchut: userInfo[0][8],
      shem_samchut: userInfo[0][9],
      kod_chail: userInfo[0][10],
      shem_chail: userInfo[0][11],
      kod_darga: userInfo[0][12],
      shem_darga: userInfo[0][13],
      cell_phone: userInfo[0][14],
      tatash_date: userInfo[0][15],
      sabat: userInfo[0][16],
      kod_isuk: userInfo[0][17],
      shem_isuk: userInfo[0][18],
    };
  }
}
