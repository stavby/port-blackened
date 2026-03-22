import { Provider } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ConfigProps } from "src/config/config.interface";
import { OpaApi } from "@port/opa-requests";

export const OPA_PROVIDE = "OPA_PROVIDE";

export const opaProvider = {
  provide: OPA_PROVIDE,
  useFactory: (configService: ConfigService<ConfigProps>): OpaApi => {
    const url = configService.get("opa.url", { infer: true })!;
    return new OpaApi(url);
  },
  inject: [ConfigService],
} satisfies Provider;
