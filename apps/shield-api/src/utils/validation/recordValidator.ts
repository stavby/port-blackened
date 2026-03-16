import { applyDecorators } from "@nestjs/common";
import { ClassConstructor, Transform, Type, plainToClass } from "class-transformer";
import {
  IsObject,
  Validate,
  ValidationArguments,
  ValidationError,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  validate,
} from "class-validator";

// only works for record with string keys and class values
@ValidatorConstraint({ async: true })
class RecordValidator<T extends Record<string, unknown>> implements ValidatorConstraintInterface {
  private validationErrors: ValidationError[][] = [];

  async validate(record: Record<string, T>, validationArguments?: ValidationArguments): Promise<boolean> {
    const ClassTransformer = validationArguments.constraints?.[0] as ClassConstructor<T>;

    if (!ClassTransformer) {
      return false;
    }
    const values = Object.values(record);

    if (values.some((value) => typeof value !== "object" || value === null)) {
      return false;
    }

    const results = await Promise.all(
      values.map((value) => {
        const tranformedValue = plainToClass(ClassTransformer, value);

        return validate(tranformedValue);
      }),
    );

    this.validationErrors = results.filter((res) => res && res.length > 0);

    return this.validationErrors.length === 0;
  }

  defaultMessage(): string {
    if (this.validationErrors.length === 0) {
      return "Body must be a record of object values";
    }

    return this.validationErrors
      .map((errors) =>
        errors
          .reduce((acc, error) => {
            return [...acc, error];
          }, [])
          .join(","),
      )
      .join(", ");
  }
}

export const ValidateRecord = (valueClass: ClassConstructor<unknown>) => {
  return applyDecorators(
    IsObject(),
    Validate(RecordValidator, [valueClass]),
    Transform(({ value }) =>
      Object.keys(value).reduce((transformedObj, currKey) => {
        transformedObj[currKey] = plainToClass(valueClass, value[currKey]);

        return transformedObj;
      }, {}),
    ),
  );
};
