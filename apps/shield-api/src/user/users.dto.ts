import { ApiProperty } from "@nestjs/swagger";
import { ColumnSchema, UserID, UserIDTransform } from "@port/common-schemas";
import {
  createUserSchema,
  editUserResponseSchema,
  editUserSchema,
  getDictUserDto,
  getPermissionTablesOptionsRequestSchema,
  getPermissionTablesOptionsSchema,
  getUserSchema,
  getUsersDictionaryDtoSchema,
  getUsersResponseSchema,
  tablePreviewDtoSchema,
} from "@port/shield-schemas";
import { ArrayNotContains, ArrayNotEmpty, ArrayUnique, IsArray, NotEquals } from "class-validator";
import { ObjectId, WithId } from "mongodb";
import { createZodDto } from "nestjs-zod";
import { Domain } from "src/domains/domains.dto";
import { GetFullUserInfoDto } from "src/user-info/user-info.interface";
import { DATALAKE_CATALOG_NAME } from "@port/common-schemas";
import { TransformToMongoObjectId, withObjectIdTransform } from "src/utils/mongo.utils";
import { IsNotEmptyString, IsObjectType } from "src/utils/validation/validation.decorators";
import { User } from "./user.classes";

export const getUserSchemaWithObjectIdTransform = withObjectIdTransform(getUserSchema);
export class ZGetUserDto extends createZodDto(getUserSchemaWithObjectIdTransform) {}
export class ZGetUsersResponseDto extends createZodDto(withObjectIdTransform(getUsersResponseSchema)) {}

export class GetNewDomainForUserDto {
  @TransformToMongoObjectId({ isArray: true })
  domainIds: ObjectId[];
}

export class CheckUsersExistenceByUserIdsReq {
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsNotEmptyString({ isArray: true })
  userIds: User["user_id"][];
}

export type CheckUsersExistenceByUserIdsRes = {
  [user_id: User["user_id"]]: boolean;
};

export class ZCreateUserDto extends createZodDto(withObjectIdTransform(createUserSchema)) {}

export class ZEditUserDto extends createZodDto(withObjectIdTransform(editUserSchema)) {}

export class ZTablePreviewDto extends createZodDto(withObjectIdTransform(tablePreviewDtoSchema)) {}

export class GetDatasetsByUserDto extends createZodDto(withObjectIdTransform(tablePreviewDtoSchema.array())) {}

export class CloneUsersDto {
  @IsNotEmptyString()
  @UserIDTransform()
  sourceUserId: UserID;

  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsNotEmptyString({ isArray: true })
  @UserIDTransform({ isArray: true })
  destinationUserIds: UserID[];
}

export class ZEditUserResDto extends createZodDto(withObjectIdTransform(editUserResponseSchema)) {}

export class AddUserCatalogsDto {
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @ArrayNotContains([DATALAKE_CATALOG_NAME], { message: `adding the catalog ${DATALAKE_CATALOG_NAME} is not allowed` })
  @ApiProperty()
  catalogs: string[];
}

export class DeleteUserCatalogsDto {
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @ArrayNotContains([DATALAKE_CATALOG_NAME], { message: `deleting the catalog ${DATALAKE_CATALOG_NAME} is not allowed` })
  @ApiProperty()
  catalogs: string[];
}

export class EditUserCatalog {
  @IsNotEmptyString()
  @NotEquals(DATALAKE_CATALOG_NAME, { message: `editing the catalog ${DATALAKE_CATALOG_NAME} is not allowed` })
  @ApiProperty()
  oldCatalogName: string;

  @IsNotEmptyString()
  @NotEquals(DATALAKE_CATALOG_NAME, { message: `changing the name of a catalog to ${DATALAKE_CATALOG_NAME} is not allowed` })
  @ApiProperty()
  newCatalogName: string;
}

export class EditUserCatalogsDto {
  @IsObjectType(EditUserCatalog, { isArray: true })
  @ArrayNotEmpty()
  catalogs: EditUserCatalog[];
}

export class UserDomainDto {
  @ApiProperty({ type: String })
  id: ObjectId;

  @ApiProperty({ type: String })
  display_name: string;

  @ApiProperty({ type: [String] })
  classifications: ObjectId[];

  @ApiProperty({ type: String })
  permission_table_id: ObjectId;
}

export type UserTrinoDataDto = Pick<GetFullUserInfoDto, "shem_darga" | "shem_yechida"> & { shem_male: string };

export interface UserWithTrinoDataDto extends Pick<User, "user_id"> {
  info?: UserTrinoDataDto;
}

export type GetUserDomainsByUserId = Array<WithId<Pick<Domain, "name" | "display_name">>>;

export class ZGetUserPermissionTablesOptionsReqDto extends createZodDto(withObjectIdTransform(getPermissionTablesOptionsRequestSchema)) {}

export class CanManageAttributesReq {
  @ArrayUnique()
  domainIds: string[];
}

export class SetSapPermittedUsersDto {
  @IsArray()
  @ArrayUnique()
  @ApiProperty()
  userIds: string[];
}

export type ColumnWithStatus = { column_name: ColumnSchema["column_name"]; is_new?: boolean; is_deleted?: boolean };
export class ZGetPermissionTablesOptionsDto extends createZodDto(withObjectIdTransform(getPermissionTablesOptionsSchema)) {}
export class ZGetDictUserDto extends createZodDto(getDictUserDto) {}
export class ZGetUsersDictionaryDto extends createZodDto(getUsersDictionaryDtoSchema) {}
