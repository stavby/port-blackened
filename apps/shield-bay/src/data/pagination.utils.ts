import { applyDecorators, Type } from "@nestjs/common";
import { ApiExtraModels, ApiOkResponse, ApiProperty, ApiQuery, getSchemaPath } from "@nestjs/swagger";
import { createZodDto, zodToOpenAPI } from "nestjs-zod";
import { z } from "zod";

export const paginationQueryParamsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  size: z.coerce.number().int().min(1).default(1000),
});

type TPaginationQueryParams = z.infer<typeof paginationQueryParamsSchema>;

export type PaginationQueryParamsName<K extends keyof TPaginationQueryParams> = Extract<keyof TPaginationQueryParams, K>;

export class PaginationQueryParams extends createZodDto(paginationQueryParamsSchema) {}

// Patch to deal with nestjs-zod not working for swagger with query params
export const ApiPaginationQueryParams = () => {
  return applyDecorators(
    ApiQuery({
      name: "page" satisfies PaginationQueryParamsName<"page">,
      required: !paginationQueryParamsSchema.shape.page.safeParse(undefined).success,
      schema: zodToOpenAPI(paginationQueryParamsSchema.shape.page),
    }),
    ApiQuery({
      name: "size" satisfies PaginationQueryParamsName<"size">,
      required: !paginationQueryParamsSchema.shape.size.safeParse(undefined).success,
      schema: zodToOpenAPI(paginationQueryParamsSchema.shape.size),
    }),
  );
};

export class PaginationResponseDto<Data> {
  @ApiProperty()
  items!: Data[];

  @ApiProperty()
  page!: number;

  @ApiProperty()
  size!: number;

  @ApiProperty()
  total!: number;
}

export const ApiPaginatedResponse = <DataDto extends Type<unknown>>(dataDto: DataDto) => {
  return applyDecorators(
    ApiExtraModels(PaginationResponseDto, dataDto),
    ApiOkResponse({
      schema: {
        allOf: [
          {
            $ref: getSchemaPath(PaginationResponseDto),
          },
          {
            properties: {
              items: {
                type: "array",
                items: {
                  $ref: getSchemaPath(dataDto),
                },
              },
            },
          },
        ],
      },
    }),
  );
};

export const ApiPagination = <DataDto extends Type<unknown>>(dataDto: DataDto) => {
  return applyDecorators(ApiPaginationQueryParams(), ApiPaginatedResponse(dataDto));
};
