import { BadRequestException, HttpException, HttpStatus, Injectable, PipeTransform, applyDecorators } from "@nestjs/common";
import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsArray, IsNotEmpty } from "class-validator";
import { ObjectId } from "mongodb";
import { MONGO_ERROR, MONGO_DUPLICATE_KEY_ERROR_CODE } from "./constants";
import z, {
  ZodArray,
  ZodBranded,
  ZodDefault,
  ZodDiscriminatedUnion,
  ZodDiscriminatedUnionOption,
  ZodEffects,
  ZodNullable,
  ZodObject,
  ZodOptional,
  ZodString,
  ZodType,
  ZodTypeAny,
  ZodUnion,
} from "zod";
import { ObjectIdBrand, OBJECT_ID_DESC } from "@port/shield-schemas";

// TODO: migrate from using this function - conversion of string to objectid should be only on the pipe level
export class MongoUtils {
  static convertStringToObjectId(id: string | ObjectId) {
    try {
      if (ObjectId.isValid(id)) {
        return new ObjectId(id);
      } else {
        return null;
      }
    } catch (error) {
      throw new HttpException("מזהה לא תקין", HttpStatus.BAD_REQUEST, { cause: error });
    }
  }
}

export const objectIdToString = (id: unknown): string | null => (id instanceof ObjectId ? id.toHexString() : null);

export const convertObjectIdToString = <T>(obj: T): T => {
  if (obj instanceof Buffer || obj instanceof ObjectId) return obj.toString() as T;

  if (typeof obj !== "object" || obj === null || obj === undefined) return obj;

  if (Array.isArray(obj)) return obj.map(convertObjectIdToString) as T;

  if (typeof obj === "object" && Object.prototype.toString.call(obj) === "[object Object]") {
    const result: Record<string, any> = {};
    for (const key in obj) {
      if (Object.hasOwn(obj, key)) {
        result[key] = convertObjectIdToString(obj[key]);
      }
    }
    return result as T;
  }
  return obj;
};

export const isMongoDuplicateKeyError = (error: any): boolean => {
  return error.name === MONGO_ERROR && error.code === MONGO_DUPLICATE_KEY_ERROR_CODE;
};

/**
 * @throws {BadRequestException}
 */
export const toMongoObjectId = (value: string | ObjectId): ObjectId => {
  if (ObjectId.isValid(value)) {
    return new ObjectId(value);
  }

  throw new BadRequestException(`${value} is not a valid mongo ObjectId`);
};

export const TransformToMongoObjectId = (options?: { isArray?: boolean }) => {
  return applyDecorators(
    ...(options?.isArray
      ? [ApiProperty({ type: [String] }), IsArray({ message: "הקלט צריך להיות מערך" })]
      : [ApiProperty({ type: String }), IsNotEmpty()]),
    Transform(({ value }) => (options?.isArray ? value.map(toMongoObjectId) : toMongoObjectId(value))),
  );
};

@Injectable()
export class ParseObjectIdPipe implements PipeTransform<string, ObjectId> {
  transform(value: string) {
    return toMongoObjectId(value);
  }
}

const applyObjectIdTransforms = (schema: ZodTypeAny): ZodTypeAny => {
  if (schema instanceof ZodObject) {
    const shape: Record<string, ZodTypeAny> = {};

    for (const key in schema.shape) {
      shape[key] = applyObjectIdTransforms(schema.shape[key]);
    }

    return z.object(shape);
  }

  if (schema instanceof ZodArray) {
    const element = applyObjectIdTransforms(schema.element);
    return z.array(element);
  }

  if (schema instanceof ZodOptional) {
    const inner = applyObjectIdTransforms(schema.unwrap());
    return z.optional(inner);
  }

  if (schema instanceof ZodNullable) {
    const inner = applyObjectIdTransforms(schema.unwrap());
    return z.nullable(inner);
  }

  if (schema instanceof ZodDefault) {
    const inner = applyObjectIdTransforms(schema._def.innerType);
    return inner.default(schema._def.defaultValue());
  }

  if (schema instanceof ZodEffects) {
    const inner = applyObjectIdTransforms(schema._def.schema);
    return new ZodEffects({
      ...schema._def,
      schema: inner,
    });
  }

  if (schema instanceof ZodUnion && Array.isArray(schema._def.options)) {
    const options = schema._def.options.map(applyObjectIdTransforms);
    return z.union(options as unknown as [ZodTypeAny, ZodTypeAny, ...ZodTypeAny[]]);
  }

  if (schema instanceof ZodDiscriminatedUnion && Array.isArray(schema._def.options)) {
    const options = schema._def.options.map(applyObjectIdTransforms);
    return z.discriminatedUnion(
      schema._def.discriminator,
      options as unknown as [ZodDiscriminatedUnionOption<any>, ...ZodDiscriminatedUnionOption<any>[]],
    );
  }

  if (schema instanceof ZodBranded && schema.description === OBJECT_ID_DESC) {
    const inner = schema.unwrap();
    if (inner instanceof ZodString) {
      return z.union([z.string(), z.instanceof(ObjectId)]).transform(toMongoObjectId);
    }
  }

  return schema;
};

export type ReplaceObjectIdString<T> = T extends ObjectIdBrand
  ? ObjectId
  : T extends (infer R)[]
    ? ReplaceObjectIdString<R>[]
    : T extends Record<PropertyKey, unknown>
      ? { [K in keyof T]: ReplaceObjectIdString<T[K]> }
      : T;

export type ReplaceFuncWithObjectIdString<T extends (...args: any[]) => any> = T extends (...args: infer Args) => infer Return
  ? (...args: ReplaceObjectIdString<Args>) => ReplaceObjectIdString<Return>
  : never;

export const withObjectIdTransform = <S extends ZodTypeAny>(schema: S): ZodType<ReplaceObjectIdString<z.infer<S>>> => {
  return applyObjectIdTransforms(schema);
};
