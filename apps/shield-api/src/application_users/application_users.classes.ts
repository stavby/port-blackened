import { createZodDto, zodToOpenAPI } from "nestjs-zod";
import {
  getApplicationUsersDto,
  getApplicationUserParams,
  getApplicationUserDto,
  deleteApplicationUserDto,
  editApplicationUserDto,
  getLoggedUserPermissionsDisplay,
  getLoggedUserInfo,
  getApplicationManagePermissionsUserDto,
  editApplicationUserReturnDto,
  createApplicationUserReturnDto,
  refinedCreateApplicationUserDto,
} from "@port/shield-schemas";
import { withObjectIdTransform } from "src/utils/mongo.utils";
import { applyDecorators } from "@nestjs/common";
import { ApiQuery } from "@nestjs/swagger";

export class ZGetApplicationUserParams extends createZodDto(getApplicationUserParams) {}

// Patch to deal with nestjs-zod not working for swagger with query params
export const ApiApplicationUserParams = () => {
  return applyDecorators(
    ...Object.entries(getApplicationUserParams.shape).map(([field, schema]) => {
      return ApiQuery({
        name: field,
        required: !schema.isOptional(),
        schema: zodToOpenAPI(schema),
      });
    }),
  );
};

export class ZGetApplicationUsersDto extends createZodDto(getApplicationUsersDto) {}
export class ZGetApplicationUserDto extends createZodDto(withObjectIdTransform(getApplicationUserDto)) {}
export class ZGetApplicationUserManagePermissionsDto extends createZodDto(withObjectIdTransform(getApplicationManagePermissionsUserDto)) {}
export class ZGetLoggedUserInfoDto extends createZodDto(withObjectIdTransform(getLoggedUserInfo)) {}
export class ZGetLoggedUserPermissionsDisplayDto extends createZodDto(withObjectIdTransform(getLoggedUserPermissionsDisplay)) {}
export class ZCreateApplicationUserDto extends createZodDto(withObjectIdTransform(refinedCreateApplicationUserDto)) {}
export class ZCreateApplicationUserReturnDto extends createZodDto(withObjectIdTransform(createApplicationUserReturnDto)) {}
export class ZEditApplicationUserDto extends createZodDto(withObjectIdTransform(editApplicationUserDto)) {}
export class ZEditApplicationUserReturnDto extends createZodDto(editApplicationUserReturnDto) {}
export class ZDeleteApplicationUserDto extends createZodDto(deleteApplicationUserDto) {}
