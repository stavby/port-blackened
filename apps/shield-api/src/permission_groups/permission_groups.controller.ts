import { Body, Controller, Delete, Get, Param, Post, Put, Res } from "@nestjs/common";
import { ApiParam } from "@nestjs/swagger";
import { CreatePermissionGroupDto, GetLoggedUserGroupPermissionsDto, ObjectIdBrand } from "@port/shield-schemas";
import { Response } from "express";
import { ObjectId } from "mongodb";
import { AuthenticatedUser } from "nest-keycloak-connect";
import { LoggedUser } from "src/auth/auth.interface";
import { EXCEL_CONTENT_DISPOSITION, EXCEL_CONTENT_TYPE_HEADER } from "src/excel/excel.constants";
import { ParseObjectIdPipe } from "src/utils/mongo.utils";
import { PermissionGroupsService } from "./permission_groups.service";
import {
  AddPermissionGroupToUsers,
  GetUsersByPermissionGroup,
  ZEditPermissionGroupDataPermissionsDto,
  ZEditPermissionGroupDataPermissionsResDto,
  ZEditPermissionGroupDetailsPermissionsDto,
  ZGetPermissionGroupDataPermissionsDto,
  ZGetPermissionGroupsDataPermissionsReqDto,
  ZGetPermissionGroupsDataPermissionsResDto,
  ZGetPermissionGroupsDto,
} from "./permission_groups.dto";

@Controller("permission_groups")
export class PermissionGroupsController {
  constructor(private readonly permissionGroupsService: PermissionGroupsService) {}

  @Get()
  async getPermissionGroups(@AuthenticatedUser() loggedUser: LoggedUser): Promise<ZGetPermissionGroupsDto[]> {
    return await this.permissionGroupsService.getPermissionGroups(loggedUser);
  }

  @Post()
  async createPermissionGroups(
    @Body() createPermissionGroupsDto: CreatePermissionGroupDto,
    @AuthenticatedUser() loggedUser: LoggedUser,
  ): Promise<ObjectId> {
    return this.permissionGroupsService.createPermissionGroup(createPermissionGroupsDto, loggedUser);
  }

  @Put("/id/:id")
  @ApiParam({ name: "id", type: "string" })
  async editPermissionGroupDetailsById(
    @Param("id", new ParseObjectIdPipe())
    id: ObjectId,
    @Body() data: ZEditPermissionGroupDetailsPermissionsDto,
    @AuthenticatedUser() loggedUser: LoggedUser,
  ): Promise<void> {
    return this.permissionGroupsService.editPermissionGroupDetailsById(id, data, loggedUser);
  }

  @Put("/id/:id/data-permissions")
  @ApiParam({ name: "id", type: "string" })
  async editPermissionGroupDataPermissionsById(
    @Param("id", new ParseObjectIdPipe())
    id: ObjectId,
    @Body() data: ZEditPermissionGroupDataPermissionsDto,
    @AuthenticatedUser() loggedUser: LoggedUser,
  ): Promise<ZEditPermissionGroupDataPermissionsResDto> {
    return this.permissionGroupsService.editPermissionGroupDataPermissionsById(id, data, loggedUser.userId);
  }

  @Delete("/id/:id")
  async deletePermissionGroupsById(
    @Param("id", new ParseObjectIdPipe())
    id: ObjectId,
    @AuthenticatedUser() loggedUser: LoggedUser,
  ) {
    return await this.permissionGroupsService.deletePermissionGroupById(id, loggedUser);
  }

  @Get("/excel")
  async getPermissionGroupsExcel(@Res() res: Response, @AuthenticatedUser() loggedUser: LoggedUser): Promise<void> {
    const permissionGroupsExcelFile = await this.permissionGroupsService.getPermissionGroupsExcel(loggedUser);

    res.setHeader(EXCEL_CONTENT_TYPE_HEADER.headerName, EXCEL_CONTENT_TYPE_HEADER.headerValue);
    res.setHeader(EXCEL_CONTENT_DISPOSITION.headerName, EXCEL_CONTENT_DISPOSITION.headerValue("permission_groups.xlsb"));

    res.send(permissionGroupsExcelFile);
  }

  @Put("/:permissionGroup/users")
  @ApiParam({ name: "permissionGroup", type: "string" })
  async addPermissionGroupToUsers(
    @AuthenticatedUser() loggedUser: LoggedUser,
    @Param("permissionGroup", new ParseObjectIdPipe()) permissionGroup: ObjectId,
    @Body() { users }: AddPermissionGroupToUsers,
  ): Promise<void> {
    await this.permissionGroupsService.addPermissionGroupToUsers(loggedUser, permissionGroup, users);
  }

  @Delete("/:permissionGroup/users/:userObjId")
  @ApiParam({ name: "permissionGroup", type: "string" })
  async deletePermissionGroupFromUser(
    @AuthenticatedUser() loggedUser: LoggedUser,
    @Param("permissionGroup", new ParseObjectIdPipe()) permissionGroup: ObjectId,
    @Param("userObjId", new ParseObjectIdPipe()) userObjId: ObjectId,
  ): Promise<void> {
    await this.permissionGroupsService.deletePermissionGroupFromUser(loggedUser, permissionGroup, userObjId);
  }

  @Get("/member-editable")
  async getMemberEditablePermissionGroups(@AuthenticatedUser() loggedUser: LoggedUser): Promise<ObjectIdBrand[]> {
    return await this.permissionGroupsService.getMemberEditablePermissionGroups(loggedUser);
  }

  @Get("/:permissionGroup/users")
  @ApiParam({ name: "permissionGroup", type: "string" })
  async getUsersByPermissionGroup(
    @Param("permissionGroup", new ParseObjectIdPipe()) permissionGroup: ObjectId,
  ): Promise<GetUsersByPermissionGroup[]> {
    return await this.permissionGroupsService.getUsersByPermissionGroup(permissionGroup);
  }

  @Get("/:permissionGroup/data-permissions")
  @ApiParam({ name: "permissionGroup", type: "string" })
  async getPermissionGroupPermissionDataDtoById(
    @Param("permissionGroup", new ParseObjectIdPipe()) permissionGroup: ObjectId,
  ): Promise<ZGetPermissionGroupDataPermissionsDto> {
    return await this.permissionGroupsService.getPermissionGroupDataPermissionsDtoById(permissionGroup);
  }

  @Post("/data-permissions/batch")
  @ApiParam({ name: "permissionGroup", type: "string" })
  async getPermissionGroupPermissionDataDtosByIds(
    @Body() { permissionGroupIds }: ZGetPermissionGroupsDataPermissionsReqDto,
  ): Promise<ZGetPermissionGroupsDataPermissionsResDto> {
    return await this.permissionGroupsService.getPermissionGroupPermissionDataDtosByIds(permissionGroupIds);
  }

  @Get("/:permissionGroup/roles/batch")
  @ApiParam({ name: "permissionGroup", type: "string" })
  async getLoggedUserGroupPermissions(
    @AuthenticatedUser() loggedUser: LoggedUser,
    @Param("permissionGroup", new ParseObjectIdPipe()) permissionGroup: ObjectId,
  ): Promise<GetLoggedUserGroupPermissionsDto> {
    return await this.permissionGroupsService.getLoggedUserGroupPermissions(loggedUser, permissionGroup);
  }
}
