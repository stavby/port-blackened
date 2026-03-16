import { SwaggerCustomOptions } from "@nestjs/swagger";
import { DATA_API_TAG } from "src/common/constants";
import { PaginationResponseDto } from "src/data/pagination.utils";

type PaginationTrinoParam<Key extends keyof PaginationResponseDto<unknown>> = keyof Pick<PaginationResponseDto<unknown>, Key>;

export const patchOpenApiSpecDocument: SwaggerCustomOptions["patchDocumentOnRequest"] = (_req, _res, document) => {
  return {
    ...document,
    paths: Object.entries(document.paths).reduce<typeof document.paths>((acc, [path, pathObject]) => {
      if (pathObject.get?.tags?.includes(DATA_API_TAG)) {
        const newPathObject = {
          ...pathObject,
          get: {
            ...pathObject.get,
            ["x-pagination"]: {
              pageParam: "page" satisfies PaginationTrinoParam<"page">,
              limitParam: "size" satisfies PaginationTrinoParam<"size">,
              resultsPath: `$response.body#/${"items" satisfies PaginationTrinoParam<"items">}`,
              totalResultsPath: `$response.body#/${"total" satisfies PaginationTrinoParam<"total">}`,
            },
          },
        };

        acc[path] = newPathObject;
      }

      return acc;
    }, {}),
  };
};
