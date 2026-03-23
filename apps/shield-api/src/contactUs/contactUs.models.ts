import { ApiProperty } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import { IsArray, IsBoolean, IsPhoneNumber, IsString, Length, MinLength, ValidateIf, ValidateNested } from "class-validator";
import { FormDataInterface } from "../utils/common.interfaces";
import { FORM_DATA_JSON_BODY, FILE_NAME } from "../utils/constants";
import { ContactUsConsts } from "../utils/validation/validation.constants";
import { shouldValidateContactField } from "../utils/validation/validation.functions";

export type ContactFields = "customfield_14200" | "summary" | "customfield_11502" | "customfield_10706" | "attachment" | "description";

export class ValidValues {
  @IsString()
  value: string;

  @IsString()
  label: string;
}

class RequestField {
  @IsString()
  fieldId: ContactFields;

  @IsString()
  name: string;

  @IsString()
  type: string;

  @IsBoolean()
  required: boolean;

  @Type(() => ValidValues)
  @ValidateNested({ each: true })
  validValues: ValidValues[];
}

class RequestType {
  @IsString()
  id: string;

  @IsString()
  name: string;

  @IsArray()
  @Type(() => RequestField)
  @ValidateNested({ each: true })
  fields: RequestField[];
}

class ContactRequest implements Record<ContactFields, unknown> {
  @ValidateNested()
  @Type(() => RequestType)
  requestType: RequestType;

  @IsString({ message: "יש להזין מערכת" })
  @MinLength(1, { message: "יש להזין מערכת" })
  @ValidateIf((obj) => shouldValidateContactField(obj, "customfield_14200"))
  customfield_14200: string;

  @IsString({ message: "יש להזין השפעה" })
  @MinLength(1, { message: "יש להזין השפעה" })
  @ValidateIf((obj) => shouldValidateContactField(obj, "customfield_10706"))
  customfield_10706: string;

  @IsString({ message: "יש להזין תקציר" })
  @MinLength(1, { message: "יש להזין תקציר" })
  @ValidateIf((obj) => shouldValidateContactField(obj, "summary"))
  summary: string;

  @IsPhoneNumber("IL", { message: "יש להכניס מספר טלפון תקין" })
  @ValidateIf((obj) => shouldValidateContactField(obj, "customfield_11502"))
  customfield_11502: string;

  @Type(() => Object)
  @Transform((params) => params.obj.attachment)
  @ValidateIf((obj) => shouldValidateContactField(obj, "attachment"))
  attachment: File | null;

  @Length(ContactUsConsts.description.MIN, ContactUsConsts.description.MAX, {
    message: `פירוט חייב להיות בין ${ContactUsConsts.description.MIN} ל-${ContactUsConsts.description.MAX} תווים`,
  })
  @ValidateIf((obj) => shouldValidateContactField(obj, "description"))
  description: string;

  constructor() {
    this.requestType = new RequestType();
    this.customfield_14200 = "";
    this.customfield_10706 = "";
    this.summary = "";
    this.customfield_11502 = "";
    this.attachment = null;
    this.description = "";
  }
}

class ContactRequestFormData implements FormDataInterface<ContactRequest> {
  @ApiProperty({ type: () => ContactRequest })
  [FORM_DATA_JSON_BODY]: ContactRequest;

  @ApiProperty({ type: "string", format: "binary", required: false })
  [FILE_NAME]?: Express.Multer.File;
}

export { ContactRequest, RequestType, ContactRequestFormData };
