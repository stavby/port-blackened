import { Controller, Get } from "@nestjs/common";
import { ExternalApi } from "src/utils/api.decorators";
import { ZGetRolesDto, ZGetRolesFgaPermissionMappingDto } from "./roles.dto";
import { RolesService } from "./roles.service";

@Controller("roles")
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @ExternalApi()
  async getNonAdminRoles(): Promise<ZGetRolesDto> {
    return await this.rolesService.getNonAdminRoles();
  }

  @Get("fga-permissions-mapping")
  @ExternalApi()
  async getRolesFgaPermissionMapping(): Promise<ZGetRolesFgaPermissionMappingDto> {
    return await this.rolesService.getRolesFgaPermissionMapping();
  }
}
