import { applyDecorators } from "@nestjs/common";
import { ApiProperty } from "@nestjs/swagger";
import { ClassConstructor, Type } from "class-transformer";
import { IsArray, IsNotEmpty, IsObject, IsString, ValidateNested } from "class-validator";

export const IsNotEmptyString = (options?: { isArray?: boolean }) => {
  return applyDecorators(IsString({ each: !!options?.isArray }), IsNotEmpty({ each: !!options?.isArray }));
};

export const IsObjectType = (classConstructor: ClassConstructor<unknown>, options?: { isArray?: boolean }) => {
  return applyDecorators(
    ...(options?.isArray ? [IsArray()] : []),
    ApiProperty({ type: options?.isArray ? [classConstructor] : classConstructor }),
    IsObject({ each: !!options?.isArray }),
    ValidateNested({ each: !!options?.isArray }),
    Type(() => classConstructor),
  );
};
