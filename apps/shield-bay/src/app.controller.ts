import { Controller, Get } from "@nestjs/common";
import { Public } from "./auth/public.decorator";

@Controller()
export class AppController {
  constructor() {}

  @Get()
  @Public()
  getWelcomeMessage(): string {
    return 'This is A Micro-Service Built On Express To Handle Shield external Requests<br/>Swagger: <a href="/docs">/docs<a/>';
  }
}
