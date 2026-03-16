import { Transform, Type } from "class-transformer";
import { ValidateIf, IsPhoneNumber, IsString, Length, MinLength, ValidateNested, IsArray, IsBoolean } from "class-validator";
import { ContactUsConsts } from "../helpers/validations/validation.constants";
import "reflect-metadata";
import { shouldValidateContactField } from "../helpers/validations/validation.functions";

class ValidValues {
  @IsString()
  value: string;

  @IsString()
  label: string;

  constructor() {
    this.value = "";
    this.label = "";
  }
}

class RequestFields {
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

  constructor() {
    this.fieldId = "summary";
    this.name = "";
    this.type = "string";
    this.required = false;
    this.validValues = [];
  }
}

class RequestType {
  @IsString()
  @MinLength(1, { message: "יש לבחור סוג בקשה" })
  id: string;

  @IsString()
  name: string;

  @IsArray()
  @Type(() => RequestFields)
  @ValidateNested({ each: true })
  fields: RequestFields[];

  constructor() {
    this.id = "";
    this.name = "";
    this.fields = [];
  }
}

type ContactFields = "customfield_14200" | "summary" | "customfield_11502" | "customfield_10706" | "attachment" | "description";

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

export { ContactRequest, RequestType };
