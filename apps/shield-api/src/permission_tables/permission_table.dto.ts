import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsBoolean, IsOptional } from "class-validator";
import { UserRowFilterValue } from "src/user/user.classes";

export class GetRowFilterValuesQueryParams {
  @IsOptional()
  @IsBoolean()
  @ApiProperty({ type: Boolean, default: false, required: false })
  @Transform(({ value }) => (value === "true" ? true : false))
  unflatten? = false;
}

export class RowFilterFlatTreeValueDto extends UserRowFilterValue {
  parent: UserRowFilterValue["value"] | null;
}

export class RowFilterTreeValueDto extends RowFilterFlatTreeValueDto {
  children: RowFilterTreeValueDto[];
}