import { Body, Controller, Get, Param, Post, Put, Res, UseGuards } from "@nestjs/common";
import { ApiParam } from "@nestjs/swagger";
import { Response } from "express";
import { ObjectId } from "mongodb";
import { AuthenticatedUser } from "nest-keycloak-connect";
import { LoggedUser } from "src/auth/auth.interface";
import { EXCEL_CONTENT_DISPOSITION, EXCEL_CONTENT_TYPE_HEADER } from "src/excel/excel.constants";
import { AdminGuard } from "src/utils/guards/admin.guard";
import { ParseObjectIdPipe } from "src/utils/mongo.utils";
import { CreateClassificationsDto, EditClassificationDto } from "./classifications.dto";
import { ClassificationsService } from "./classifications.service";
import { ClassificationOutput } from "./classifications.interface";

@Controller("classifications")
@UseGuards(AdminGuard)
export class ClassificationsController {
  constructor(private readonly classificationsService: ClassificationsService) {}

  @Get()
  async getClassificationsWithRelatedDomains(): Promise<ClassificationOutput[]> {
    return this.classificationsService.getClassificationsWithRelatedDomains();
  }

  @Put("/id/:id")
  @ApiParam({ name: "id", type: "string" })
  async editClassificationsById(
    @Param("id", new ParseObjectIdPipe())
    id: ObjectId,
    @Body() { description, name }: EditClassificationDto,
    @AuthenticatedUser() user: LoggedUser,
  ): Promise<void> {
    return this.classificationsService.editClassificationById(id, name, description, user.userId);
  }

  @Post("create")
  async createClassifications(
    @Body() createClassificationsDto: CreateClassificationsDto,
    @AuthenticatedUser() user: LoggedUser,
  ): Promise<ObjectId> {
    return this.classificationsService.createClassification(createClassificationsDto, user.userId);
  }

  @Get("/excel")
  async getClassificationsExcel(@Res() res: Response): Promise<void> {
    const classificationsExcelFile = await this.classificationsService.getClassificationsExcel();

    res.setHeader(EXCEL_CONTENT_TYPE_HEADER.headerName, EXCEL_CONTENT_TYPE_HEADER.headerValue);
    res.setHeader(EXCEL_CONTENT_DISPOSITION.headerName, EXCEL_CONTENT_DISPOSITION.headerValue("classifications.xlsb"));

    res.send(classificationsExcelFile);
  }
}
