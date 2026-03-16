import { Controller, Get, Param } from "@nestjs/common";
import { GetFullUserInfoDto, GetUserInfoDto } from "./user-info.interface";
import { UserInfoService } from "./user-info.service";
import { ParseUserIdPipe } from "src/utils/utils";
import { UserID } from "@port/common-schemas";

@Controller("user-info")
export class UserInfoController {
  constructor(private readonly userInfoService: UserInfoService) {}

  @Get("search/:search")
  async searchUsers(@Param("search") search: string): Promise<GetUserInfoDto[]> {
    return await this.userInfoService.searchUsers(search, true);
  }

  @Get(":user_id/full")
  async getUserInfo(@Param("user_id", new ParseUserIdPipe()) user_id: UserID): Promise<GetFullUserInfoDto> {
    return await this.userInfoService.getFullUserInfoByUserId(user_id, true);
  }

  @Get(":user_id")
  async getUserInfoByUserId(@Param("user_id", new ParseUserIdPipe()) user_id: UserID): Promise<GetUserInfoDto> {
    return await this.userInfoService.getUserInfoByUserId(user_id, true);
  }
}
