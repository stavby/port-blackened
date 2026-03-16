import { InternalServerErrorException } from "@nestjs/common";
import { z } from "zod";
import { TableSchemaDef } from "./metadata.dtos";

const extractZodType = (zodType: z.ZodTypeAny) => {
  if (
    zodType instanceof z.ZodString ||
    zodType instanceof z.ZodEnum ||
    zodType instanceof z.ZodNativeEnum ||
    zodType instanceof z.ZodObject ||
    zodType instanceof z.ZodUnknown ||
    zodType instanceof z.ZodRecord ||
    zodType instanceof z.ZodDate
  ) {
    return "string";
  } else if (zodType instanceof z.ZodNumber) {
    return "integer";
  } else if (zodType instanceof z.ZodBoolean) {
    return "boolean";
  } else if (zodType instanceof z.ZodEffects) {
    return extractZodType(zodType._def.schema);
  } else if (zodType instanceof z.ZodOptional) {
    return extractZodType(zodType._def.innerType);
  } else if (zodType instanceof z.ZodDefault) {
    return extractZodType(zodType._def.innerType);
  } else if (zodType instanceof z.ZodNullable) {
    return extractZodType(zodType._def.innerType);
  } else {
    throw new InternalServerErrorException(
      `zodToTableSchemaDef - Unsupported col type ${zodType._def.typeName}`
    );
  }
};

export const zodToTableSchemaDef = (
  zodObject: z.SomeZodObject
): TableSchemaDef[] => {
  return Object.entries(zodObject.shape).map(([key, value]) => ({
    col_name: key,
    col_type: extractZodType(value)
  }));
};
