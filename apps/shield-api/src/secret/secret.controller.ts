import { Controller, Get } from "@nestjs/common";
import { ExternalApi } from "src/utils/api.decorators";
import { Secret } from "./secret.interface";
import { SecretService } from "./secret.service";

@Controller("secret")
export class SecretController {
  constructor(private readonly secretService: SecretService) {}

  @Get()
  @ExternalApi()
  async getSecret(): Promise<Secret> {
    return await this.secretService.getSecret();
  }
}
