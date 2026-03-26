import { Body, Controller, Delete, Param, Post, UseGuards } from "@nestjs/common";
import { AdminService } from "./admin.service";
import { AdminGuard } from "src/utils/guards/admin.guard";
import { ManageWritePermissionsToUserDTO } from "./admin.models";
import { ApiTags } from "@nestjs/swagger";

@Controller("admin")
@ApiTags("Admin")
@UseGuards(AdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post("fga-schema-object/:schema_name")
  async createFGASchemaObject(@Param("schema_name") schema_name: string) {
    await this.adminService.createFGASchemaObject(schema_name);
  }

  @Post("user-write-permissions")
  giveWritePermissionsOnSchemaToUser(@Body() body: ManageWritePermissionsToUserDTO) {
    this.adminService.giveWritePermissionsOnSchemaToUser(body);
  }

  @Delete("user-write-permissions")
  revokeWritePermissionsOnSchemaFromUser(@Body() body: ManageWritePermissionsToUserDTO) {
    this.adminService.revokeWritePermissionsOnSchemaFromUser(body);
  }
}
