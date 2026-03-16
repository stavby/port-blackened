import { PickType } from "@nestjs/swagger";
import { IsArray, IsNotEmpty, IsString, MinLength } from "class-validator";
export class CreateClassificationsDto {
  @IsNotEmpty({ message: "אין להשאיר שדות ריקים" })
  @IsString({ message: "סוג קלט לא תקין" })
  @MinLength(3, { message: "אורך מינימלי 3 תווים" })
  name: string;

  @IsNotEmpty({ message: "אין להשאיר שדות ריקים" })
  @IsString({ message: "סוג קלט לא תקין" })
  @MinLength(3, { message: "אורך מינימלי 3 תווים" })
  description: string;

  @IsArray({ message: "סוג קלט לא תקין" })
  @IsString({ message: "סוג קלט לא תקין", each: true })
  related_domains: string[];
}

export class EditClassificationDto extends PickType(CreateClassificationsDto, ["name", "description"]) {}
