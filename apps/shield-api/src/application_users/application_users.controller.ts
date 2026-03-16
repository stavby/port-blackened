import { Body, Controller, Delete, Get, Param, Post, Put, Query } from "@nestjs/common";
import { ExternalApi } from "src/utils/api.decorators";
import {
  ApiApplicationUserParams,
  ZCreateApplicationUserDto,
  ZCreateApplicationUserReturnDto,
  ZDeleteApplicationUserDto,
  ZEditApplicationUserDto,
  ZEditApplicationUserReturnDto,
  ZGetApplicationUserDto,
  ZGetApplicationUserManagePermissionsDto,
  ZGetApplicationUserParams,
  ZGetApplicationUsersDto,
} from "./application_users.classes";
import { ApplicationUsersService } from "./application_users.service";
import { ApiTags } from "@nestjs/swagger";
import { ParseUserIdPipe } from "src/utils/utils";
import { UserID } from "@port/common-schemas";

@Controller("application_users")
@ApiTags("Application Users")
@ExternalApi()
export class ApplicationUsersController {
  constructor(private readonly applicationUsersService: ApplicationUsersService) {}

  @Get()
  @ApiApplicationUserParams()
  async getApplicationsUsers(@Query() params: ZGetApplicationUserParams): Promise<ZGetApplicationUsersDto> {
    return await this.applicationUsersService.getApplicationUsers(params);
  }

  @Post("sync")
  async syncMongoFromOpenFga(): Promise<void> {
    return await this.applicationUsersService.syncMongoFromOpenFga();
  }

  @Get("userId/:userId")
  async getApplicationUserDto(@Param("userId", new ParseUserIdPipe()) userId: UserID): Promise<ZGetApplicationUserDto> {
    return await this.applicationUsersService.getApplicationUserDto(userId);
  }

  @Get("userId/:userId/manage")
  async getApplicationUserManagePermissionsDto(
    @Param("userId", new ParseUserIdPipe()) userId: UserID,
  ): Promise<ZGetApplicationUserManagePermissionsDto> {
    return await this.applicationUsersService.getApplicationUserManagePermissionsDto(userId);
  }

  @Post()
  async createApplicationUser(@Body() data: ZCreateApplicationUserDto): Promise<ZCreateApplicationUserReturnDto> {
    return await this.applicationUsersService.createApplicationUser(data);
  }

  @Put()
  async editApplicationUserByUserId(@Body() data: ZEditApplicationUserDto): Promise<ZEditApplicationUserReturnDto> {
    return await this.applicationUsersService.editApplicationUserByUserId(data);
  }

  @Delete()
  async deleteApplicationUserByUserId(@Body() data: ZDeleteApplicationUserDto): Promise<void> {
    return await this.applicationUsersService.deleteApplicationUserByUserId(data);
  }
}
