import { Body, Controller, Get, Param, Patch, Post, Res, UseGuards } from "@nestjs/common";
import { ApiParam } from "@nestjs/swagger";
import { Response } from "express";
import { ObjectId, WithId } from "mongodb";
import { AuthenticatedUser } from "nest-keycloak-connect";
import { LoggedUser } from "src/auth/auth.interface";
import { Classification } from "src/classifications/classifications.classes";
import { EXCEL_CONTENT_DISPOSITION, EXCEL_CONTENT_TYPE_HEADER } from "src/excel/excel.constants";
import { ExternalApi } from "src/utils/api.decorators";
import { AdminGuard } from "src/utils/guards/admin.guard";
import { ParseObjectIdPipe } from "src/utils/mongo.utils";
import { CreateDomainDto, Domain, DomainWithClassificationsDto, EditDomainDto } from "./domains.dto";
import { DomainClassificationExposures, DomainsDictionary } from "./domains.interface";
import { DomainsService } from "./domains.service";
import { FGADomainRelationConstants, FGADomain_classificationRelationConstants } from "@port/openfga-client";

@Controller("domains")
export class DomainsController {
  constructor(private readonly domainsService: DomainsService) {}

  @ExternalApi()
  @Get()
  async getAllDomains(): Promise<Domain[]> {
    return await this.domainsService.getAllDomains();
  }

  @ExternalApi()
  @Get("/with-classifications/external")
  async getDomainsWithClassificationsExternal() {
    return await this.domainsService.getDomainsWithClassifications();
  }

  @Get("/client")
  async getAllDomainsClient(): Promise<Domain[]> {
    return await this.domainsService.getAllDomains();
  }

  @Get("/manage-users")
  async getDomainsManage(@AuthenticatedUser() user: LoggedUser): Promise<WithId<Domain>[]> {
    return await this.domainsService.getDomainsByDomainRelation(user.userId, {
      relationDomain: FGADomainRelationConstants.can_manage_data_permissions,
      relationClassification: FGADomain_classificationRelationConstants.can_assign_to_user,
    });
  }

  // IMPORTANT: this two endpoints are the same, only seperated for auth reasons. should fix later to use uncoupled login in client
  @ExternalApi()
  @Get("dictionary")
  async getDomainsDictionary(): Promise<DomainsDictionary> {
    return await this.domainsService.getDomainsDictionary();
  }

  @Get("dictionary/client")
  async getDomainsDictionaryClient(): Promise<DomainsDictionary> {
    return await this.domainsService.getDomainsDictionary();
  }

  @ApiParam({ name: "id", type: "string" })
  @Get("/id/:id")
  async getDomainById(@Param("id", new ParseObjectIdPipe()) id: ObjectId): Promise<Domain> {
    return await this.domainsService.getDomainById(id);
  }

  @Get("/id/:id/classifications")
  async getDomainClassifications(@Param("id") id: string, @AuthenticatedUser() user: LoggedUser): Promise<WithId<Classification>[]> {
    return await this.domainsService.getDomainClassifications(id, user.userId);
  }

  @ApiParam({ name: "id", type: "string" })
  @Get("/id/:id/with-classifications")
  async getDomainWithClassifications(@Param("id") id: string): Promise<DomainWithClassificationsDto> {
    return await this.domainsService.getDomainWithClassifications(id);
  }

  @UseGuards(AdminGuard)
  @Post()
  async createDomain(@Body() domain: CreateDomainDto, @AuthenticatedUser() user: LoggedUser): Promise<void> {
    await this.domainsService.createDomain(domain, user.userId);
  }

  @UseGuards(AdminGuard)
  @ApiParam({ name: "id", type: "string" })
  @Patch("/id/:id")
  async editDomain(
    @Param("id", new ParseObjectIdPipe()) id: ObjectId,
    @Body() domain: EditDomainDto,
    @AuthenticatedUser() user: LoggedUser,
  ): Promise<void> {
    await this.domainsService.editDomainById(id, domain, user.userId);
  }

  @Get("/with-classifications")
  async getDomainsWithClassifications() {
    return await this.domainsService.getDomainsWithClassifications();
  }

  @UseGuards(AdminGuard)
  @Get("/excel")
  async getDomainsExcel(@Res() res: Response): Promise<void> {
    const domainsExcelFile = await this.domainsService.getDomainsExcel();

    res.setHeader(EXCEL_CONTENT_TYPE_HEADER.headerName, EXCEL_CONTENT_TYPE_HEADER.headerValue);
    res.setHeader(EXCEL_CONTENT_DISPOSITION.headerName, EXCEL_CONTENT_DISPOSITION.headerValue("domains.xlsb"));

    res.send(domainsExcelFile);
  }

  @ApiParam({ name: "id", type: "string" })
  @Get("/id/:id/classification-exposure")
  async getClassificationExposureById(
    @Param("id", new ParseObjectIdPipe()) id: ObjectId,
    @AuthenticatedUser() user: LoggedUser,
  ): Promise<DomainClassificationExposures> {
    return await this.domainsService.getClassificationsExposureById(id, user.userId);
  }
}
