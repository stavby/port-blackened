import { Body, Controller, Delete, ForbiddenException, Get, Param, Patch, Post, Put, Query, Res, UseGuards } from "@nestjs/common";
import { ApiOperation, ApiParam, ApiTags } from "@nestjs/swagger";
import { UserID } from "@port/common-schemas";
import { Response } from "express";
import { ObjectId, UpdateResult } from "mongodb";
import { AuthenticatedUser } from "nest-keycloak-connect";
import { BasicAuthenticatedUser, LoggedUser } from "src/auth/auth.interface";
import { EXCEL_CONTENT_DISPOSITION, EXCEL_CONTENT_TYPE_HEADER } from "src/excel/excel.constants";
import { CustomerRoute, ExternalApi } from "src/utils/api.decorators";
import { AdminGuard } from "src/utils/guards/admin.guard";
import { ParseObjectIdPipe } from "src/utils/mongo.utils";
import { ParseUserIdPipe } from "src/utils/utils";
import { User, ZFilterUsersDto, ZGetTableColumnDictDto, ZGetUserPreviewDto } from "./user.classes";
import { UserService } from "./user.service";
import {
  AddUserCatalogsDto,
  CanManageAttributesReq,
  CheckUsersExistenceByUserIdsReq,
  CheckUsersExistenceByUserIdsRes,
  CloneUsersDto,
  DeleteUserCatalogsDto,
  EditUserCatalogsDto,
  GetDatasetsByUserDto,
  GetUserDomainsByUserId,
  UserWithTrinoDataDto,
  ZCreateUserDto,
  ZEditUserDto,
  ZEditUserResDto,
  ZGetPermissionTablesOptionsDto,
  ZGetUserDto,
  ZGetUserPermissionTablesOptionsReqDto,
  ZGetUsersDictionaryDto,
  ZGetUsersResponseDto,
} from "./users.dto";

@Controller("users")
@ApiTags("Users")
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post("unblocked")
  async getUnblockedUsers(
    @AuthenticatedUser() { userId }: LoggedUser,
    @Query("page") page: number,
    @Query("search") search?: string,
    @Body() filters?: ZFilterUsersDto,
  ): Promise<ZGetUsersResponseDto> {
    return await this.userService.getUnblockedUsers({
      search,
      page,
      filters,
      includeUniquePopulation: await this.userService.hasPermissionsForUniquePopulations(userId),
    });
  }

  @ExternalApi()
  @Get("dictionary")
  async getUsersDictionary(): Promise<ZGetUsersDictionaryDto> {
    return await this.userService.getUsersDictionary();
  }

  @ExternalApi()
  @Get("/info")
  async getUsersWithAdInfo(): Promise<UserWithTrinoDataDto[]> {
    return await this.userService.getUsersWithTrinoData();
  }

  @CustomerRoute(["campus"])
  @Get("/userId/:userId")
  async getUnblockedUserByUserId(
    @AuthenticatedUser() user: LoggedUser,
    @Param("userId", new ParseUserIdPipe()) userId: UserID,
  ): Promise<ZGetUserDto> {
    return await this.userService.getUnblockedUserByUserId(userId, user.userId);
  }

  @Get("/isSapPermitted/:userId")
  async getIsUserSapPermittedByUserId(@Param("userId", new ParseUserIdPipe()) userId: UserID): Promise<boolean> {
    return await this.userService.getIsUserSapPermittedByUserId(userId);
  }

  @Get("/hasPermissionsForUniquePopulations")
  async hasPermissionsForUniquePopulations(@AuthenticatedUser() user: LoggedUser): Promise<boolean> {
    return await this.userService.hasPermissionsForUniquePopulations(user.userId);
  }

  @Get("/unique-population-options")
  async getUniquePopulationOptions(@AuthenticatedUser() { userId }: LoggedUser) {
    if (!(await this.userService.hasPermissionsForUniquePopulations(userId))) {
      throw new ForbiddenException(`${userId} is not authorized for unique populations`);
    }

    return await this.userService.getUniquePopulationOptions();
  }

  @Post("/hasPermissionsForDeceasedPopulations")
  async hasPermissionsForDeceasedPopulations(
    @AuthenticatedUser() user: LoggedUser,
    @Body() { domainIds }: CanManageAttributesReq,
  ): Promise<boolean> {
    return await this.userService.hasPermissionsForDeceasedPopulations(user.userId, domainIds);
  }

  @Post("/hasPermissionsForMask")
  async hasPermissionsForMask(@AuthenticatedUser() user: LoggedUser, @Body() { domainIds }: CanManageAttributesReq): Promise<boolean> {
    return await this.userService.hasPermissionsForMask(user.userId, domainIds);
  }

  @Post("/existence")
  async checkUsersExistenceByUserIds(@Body() { userIds }: CheckUsersExistenceByUserIdsReq): Promise<CheckUsersExistenceByUserIdsRes> {
    return await this.userService.checkUsersExistenceByUserIds(userIds);
  }

  @ExternalApi()
  @Get("/userId/:userId/domains")
  async getUserDomainsByUserId(@Param("userId", new ParseUserIdPipe()) userId: UserID): Promise<GetUserDomainsByUserId> {
    return await this.userService.getUserDomainByUserId(userId);
  }

  @ExternalApi()
  @Post("block/:id")
  async blockUser(
    @Param("id", new ParseUserIdPipe()) userId: UserID,
    @AuthenticatedUser() user: BasicAuthenticatedUser,
  ): Promise<UpdateResult<User>> {
    return await this.userService.blockUser(userId, user.userId);
  }

  @Post("permission_tables/options")
  async getPermissionTablesOptions(@Body() { domains }: ZGetUserPermissionTablesOptionsReqDto): Promise<ZGetPermissionTablesOptionsDto> {
    return this.userService.getPermissionTablesOptions(domains);
  }

  @Post("/excel")
  async getUsersExcel(
    @AuthenticatedUser() { userId }: LoggedUser,
    @Res() res: Response,
    @Query("search") search?: string,
    @Body() filters?: ZFilterUsersDto,
  ): Promise<void> {
    const usersExcelFile = await this.userService.getUsersExcel(userId, search, filters);

    res.setHeader(EXCEL_CONTENT_TYPE_HEADER.headerName, EXCEL_CONTENT_TYPE_HEADER.headerValue);
    res.setHeader(EXCEL_CONTENT_DISPOSITION.headerName, EXCEL_CONTENT_DISPOSITION.headerValue("users.xlsb"));

    res.send(usersExcelFile);
  }

  @UseGuards(AdminGuard)
  @ApiParam({ name: "id", type: "string" })
  @Patch("/id/:id")
  async deleteUserById(@Param("id", new ParseObjectIdPipe()) id: ObjectId, @AuthenticatedUser() user: LoggedUser): Promise<void> {
    return this.userService.deleteUserById(id, user.userId);
  }

  @Delete("/id/:id/domain/:domainId")
  @ApiParam({ name: "id", type: "string" })
  @ApiParam({ name: "domainId", type: "string" })
  async deleteUserDomainByDomainId(
    @Param("id", new ParseObjectIdPipe()) id: ObjectId,
    @Param("domainId", new ParseObjectIdPipe()) domainId: ObjectId,
    @AuthenticatedUser() user: LoggedUser,
  ): Promise<ZGetUserDto> {
    return this.userService.deleteUserDomainByDomainId(id, domainId, user);
  }

  @Post("clone/batch")
  async cloneUsers(@Body() data: CloneUsersDto, @AuthenticatedUser() loggedUser: LoggedUser): Promise<void> {
    await this.userService.cloneUsers(data.sourceUserId, data.destinationUserIds, loggedUser);
  }

  @Put(":id")
  @ApiParam({ name: "id", type: "string" })
  @CustomerRoute(["campus"])
  /** @important This Endpoint is used by customers */
  async editUser(
    @AuthenticatedUser() user: LoggedUser,
    @Param("id", new ParseObjectIdPipe()) id: ObjectId,
    @Body()
    data: ZEditUserDto,
  ): Promise<ZEditUserResDto> {
    return await this.userService.editUser(id, data, user);
  }

  // IMPORTANT: This is used by external APIs, caution if changing anything
  @Post()
  @CustomerRoute(["campus"])
  async createUser(
    @AuthenticatedUser() user: LoggedUser,
    @Body()
    data: ZCreateUserDto,
  ): Promise<ZGetUserDto> {
    return await this.userService.createUser(data, user);
  }

  @ExternalApi()
  @Get("/userId/:userId/catalogs")
  async getUserCatalogsByUserId(@Param("userId", new ParseUserIdPipe()) userId: UserID): Promise<User["catalogs"]> {
    return await this.userService.getUserCatalogsByUserId(userId);
  }

  @ExternalApi()
  @ApiOperation({
    description: "Adds new catalogs to a specified user. If the catalog already exits nothing changes. Cannot add datalake catalog",
  })
  @Post("userId/:userId/catalogs")
  async addUserCatalogsByUserId(
    @AuthenticatedUser() user: BasicAuthenticatedUser,
    @Param("userId", new ParseUserIdPipe()) userId: UserID,
    @Body()
    { catalogs }: AddUserCatalogsDto,
  ): Promise<User["catalogs"]> {
    return await this.userService.addUserCatalogsByUserId(user.userId, userId, catalogs);
  }

  @ExternalApi()
  @Patch("userId/:userId/catalogs")
  @ApiOperation({
    description: `Edits the name of exiting catalogs of a specified user.
                  If the catalog doesn't exit nothing changes.
                  If the catalog new name is an existing catalog of the user, they will merge (no duplicates would be created).
                  Cannot edit datalake catalog`,
  })
  async editUserCatalogsByUserId(
    @AuthenticatedUser() user: BasicAuthenticatedUser,
    @Param("userId", new ParseUserIdPipe()) userId: UserID,
    @Body()
    { catalogs }: EditUserCatalogsDto,
  ): Promise<User["catalogs"]> {
    return await this.userService.editUserCatalogsByUserId(user.userId, userId, catalogs);
  }

  @ExternalApi()
  @Delete("userId/:userId/catalogs")
  @ApiOperation({
    description: "Deletes catalogs from a specified user. If the catalog doesn't exit nothing changes. Cannot delete datalake catalog",
  })
  async deleteUserCatalogsByUserId(
    @AuthenticatedUser() user: BasicAuthenticatedUser,
    @Param("userId", new ParseUserIdPipe()) userId: UserID,
    @Body()
    { catalogs }: DeleteUserCatalogsDto,
  ): Promise<User["catalogs"]> {
    return await this.userService.deleteUserCatalogsByUserId(user.userId, userId, catalogs);
  }

  @ExternalApi()
  @Post("sapPermittedUsers")
  async setSapPermittedUsers(): Promise<{ added: number; removed: number }> {
    return await this.userService.refreshSapPermittedUsers();
  }

  @Post("/liveTablesByUser/:userId")
  async getDatasetsByUser(
    @Param("userId", new ParseUserIdPipe()) userId: UserID,
    @Body() data: ZGetUserPreviewDto,
  ): Promise<GetDatasetsByUserDto> {
    return await this.userService.getLiveTablesByUser(userId, data);
  }

  @Post("/liveColumnsByTable/:userId/table/:tableSchema/:tableName")
  async getDatasetByTableAndUser(
    @Param("userId", new ParseUserIdPipe()) userId: UserID,
    @Param("tableSchema") tableSchema: string,
    @Param("tableName") tableName: string,
    @Body() data: ZGetUserPreviewDto,
  ): Promise<ZGetTableColumnDictDto> {
    return await this.userService.getLiveColumnsByTable(userId, { tableSchema, tableName }, data);
  }
}
