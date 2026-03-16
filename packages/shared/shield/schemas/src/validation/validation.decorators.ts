import { ClassConstructor, Type } from "class-transformer";
import { IsArray, IsInt, IsNotEmpty, IsObject, IsPositive, IsString, ValidateNested } from "class-validator";

const applyDecorators = (...decorators: (ClassDecorator | MethodDecorator | PropertyDecorator)[]) => {
  return <TFunction extends Function, Y>(
    target: TFunction | object,
    propertyKey?: string | symbol,
    descriptor?: TypedPropertyDescriptor<Y>,
  ) => {
    for (const decorator of decorators) {
      if (target instanceof Function && !descriptor) {
        (decorator as ClassDecorator)(target);
        continue;
      }
      (decorator as MethodDecorator | PropertyDecorator)(target, propertyKey!, descriptor!);
    }
  };
};

const IsPositiveInt = () => {
  return applyDecorators(IsPositive(), IsInt());
};

const IsNotEmptyString = (options?: { isArray?: boolean }) => {
  return applyDecorators(IsString({ each: !!options?.isArray }), IsNotEmpty({ each: !!options?.isArray }));
};

const IsObjectType = (classConstructor: ClassConstructor<unknown>, options?: { isArray?: boolean }) => {
  return applyDecorators(
    ...(options?.isArray ? [IsArray()] : []),
    //remove check later
    //ApiProperty({ type: options?.isArray ? [classConstructor] : classConstructor }),
    IsObject({ each: !!options?.isArray }),
    ValidateNested({ each: !!options?.isArray }),
    Type(() => classConstructor),
  );
};

export { IsNotEmptyString, IsObjectType, IsPositiveInt };
