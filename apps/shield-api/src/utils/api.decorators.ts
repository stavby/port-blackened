import { applyDecorators, UseGuards } from "@nestjs/common";
import { ApiBasicAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Public as OIDCPublic } from "nest-keycloak-connect";
import { BasicAuthGuard } from "src/basicAuth/basicAuth.guard";

export const ExternalApi = () => {
  return applyDecorators(ApiTags("External API"), OIDCPublic(), ApiBasicAuth(), UseGuards(BasicAuthGuard));
};

export const CustomerRoute = (customers: ("all" | "campus" | "insight")[]) =>
  applyDecorators(
    ApiOperation(
      {
        summary: `Customer Route: ${customers.map((customer) => customer.charAt(0).toUpperCase() + customer.substring(1).toLowerCase()).join(", ")}`,
      },
      { overrideExisting: false },
    ),
  );
