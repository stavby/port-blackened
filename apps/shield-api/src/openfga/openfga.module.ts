import { Global, Module } from "@nestjs/common";
import { OpenFgaService } from "./openfga.service";

@Global()
@Module({
  providers: [OpenFgaService],
  exports: [OpenFgaService],
})
export class OpenFgaModule {}
