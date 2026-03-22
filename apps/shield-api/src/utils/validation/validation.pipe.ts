import { ArgumentMetadata, Injectable, PipeTransform, ValidationPipe, ValidationPipeOptions } from "@nestjs/common";
import { ZodDto, ZodValidationPipe } from "nestjs-zod";

@Injectable()
export class CustomValidationPipe implements PipeTransform {
  private readonly classValidatorPipe: ValidationPipe;
  private readonly zodValidationPipe: PipeTransform;

  constructor(classValidatorPipeOptions?: ValidationPipeOptions) {
    this.classValidatorPipe = new ValidationPipe(classValidatorPipeOptions);
    this.zodValidationPipe = new ZodValidationPipe();
  }

  private isZodDto(metatype: unknown): metatype is ZodDto<unknown> {
    return !!metatype && (typeof metatype === "function" || typeof metatype === "object") && "isZodDto" in metatype && !!metatype.isZodDto;
  }

  transform(value: unknown, metadata: ArgumentMetadata) {
    if (this.isZodDto(metadata.metatype)) {
      return this.zodValidationPipe.transform(value, metadata);
    } else {
      return this.classValidatorPipe.transform(value, metadata);
    }
  }
}
