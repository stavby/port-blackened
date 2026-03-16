import { IsNotEmptyString } from "src/utils/validation/validation.decorators";

export class Classification {
  @IsNotEmptyString()
  name: string;

  @IsNotEmptyString()
  description: string;
}
