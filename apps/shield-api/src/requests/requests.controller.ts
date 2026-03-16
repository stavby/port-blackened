import { Controller, Get, Param } from "@nestjs/common";
import { Requests } from "./requests.interface";
import { RequestsService } from "./requests.service";

@Controller("requests")
export class RequestsController {
  constructor(private readonly requestsService: RequestsService) {}

  @Get()
  async getAllRequests(): Promise<Requests[]> {
    return await this.requestsService.getAllRequests();
  }

  @Get(":userId")
  async getRequest(@Param("userId") userId: string): Promise<Requests[]> {
    return await this.requestsService.getRequestByUser(userId);
  }
}
