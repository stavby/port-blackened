import { getRolesDto, getRolesFgaPermissionMappingDto } from "@port/shield-schemas";
import { createZodDto } from "nestjs-zod";
import { withObjectIdTransform } from "src/utils/mongo.utils";

export const getRolesDtoWithObjectIdTransform = withObjectIdTransform(getRolesDto);
export class ZGetRolesDto extends createZodDto(getRolesDtoWithObjectIdTransform) {}

export class ZGetRolesFgaPermissionMappingDto extends createZodDto(getRolesFgaPermissionMappingDto) {}
