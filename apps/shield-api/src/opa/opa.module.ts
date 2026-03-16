import { Module } from "@nestjs/common";
import { OPA_PROVIDE, opaProvider } from "./opa.provider";

@Module({
  providers: [opaProvider],
  exports: [OPA_PROVIDE],
})
export class OPAModule {}
