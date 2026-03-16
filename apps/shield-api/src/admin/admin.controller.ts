import { Body, Controller, Delete, Param, Post, UseGuards } from "@nestjs/common";
import { AdminService } from "./admin.service";
import { AdminGuard } from "src/utils/guards/admin.guard";
import { ManageWritePermissionsToUserDTO } from "./admin.models";

@Controller("admin")
@UseGuards(AdminGuard)
export class AdminController {
  constructor(private readonly adminTempService: AdminService) {}

  @Post("fga-schema-object/:schema_name")
  async createFGASchemaObject(@Param("schema_name") schema_name: string) {
    await this.adminTempService.createFGASchemaObject(schema_name);
  }

  @Post("user-write-permissions")
  giveWritePermissionsOnSchemaToUser(@Body() body: ManageWritePermissionsToUserDTO) {
    this.adminTempService.giveWritePermissionsOnSchemaToUser(body);
  }

  @Delete("user-write-permissions")
  revokeWritePermissionsOnSchemaFromUser(@Body() body: ManageWritePermissionsToUserDTO) {
    this.adminTempService.revokeWritePermissionsOnSchemaFromUser(body);
  }
}
