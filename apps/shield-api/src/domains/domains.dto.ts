import { ApiProperty, PickType } from "@nestjs/swagger";
import { IsNotEmpty, IsString, Matches } from "class-validator";
import { ObjectId } from "mongodb";
import { createZodDto } from "nestjs-zod";
import { TransformToMongoObjectId } from "src/utils/mongo.utils";
import { domainWithClassificationsSchema } from "@port/shield-schemas";

const SNAKE_CASE_REGEX = /^[a-z]+(_[a-z]+)*$/;

class BaseDomain {
  @Matches(SNAKE_CASE_REGEX, {
    message: "שם העולם תוכן חייב להיות בסנייק קייס",
  })
  name: string;
}

class Domain extends BaseDomain {
  @IsNotEmpty({ message: "השם הידידותי של העולם התוכן חייב להיות מלא" })
  @IsString({ message: "השם הידידותי של העולם התוכן חייב להיות מסוג מחרוזת" })
  display_name: string;

  @TransformToMongoObjectId({ isArray: true })
  classifications: ObjectId[];
}

class InternalDomain extends BaseDomain {
  not_for_use: true;
  tables: string[];
  // empty in prod
  @ApiProperty({ type: [String] })
  classifications: ObjectId[];
}

class CreateDomainDto extends PickType(Domain, ["name", "display_name", "classifications"]) {}

class EditDomainDto extends PickType(Domain, ["display_name", "classifications"]) {}

class DomainWithClassificationsDto extends createZodDto(domainWithClassificationsSchema) {}

export { CreateDomainDto, Domain, DomainWithClassificationsDto, EditDomainDto, InternalDomain };
