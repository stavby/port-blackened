import { Body, Controller, Get, Post, Req, UploadedFile, UseGuards, UseInterceptors } from "@nestjs/common";
import { ContactUsService } from "./contactUs.service";
import { ApiBody, ApiConsumes, ApiTags } from "@nestjs/swagger";
import { FileInterceptor } from "@nestjs/platform-express";
import { ContactRequest, RequestType, ContactRequestFormData } from "./contactUs.models";
import { FormDataParseInterceptor } from "../utils/formData.interceptor";
import { FILE_NAME } from "../utils/constants";
import { ContactUser } from "./contactUs.interfaces";
import { AuthenticatedUser } from "nest-keycloak-connect";
import { LoggedUser } from "src/auth/auth.interface";

@Controller("contact")
@ApiTags("Contact Us")
export class ContactUsController {
  constructor(private readonly contactusService: ContactUsService) {}

  @Get("types")
  getContactTypes(): Promise<RequestType[]> {
    return this.contactusService.getContactTypes();
  }

  @Post()
  @ApiConsumes("multipart/form-data")
  @ApiBody({ type: ContactRequestFormData })
  @UseInterceptors(FileInterceptor(FILE_NAME), FormDataParseInterceptor)
  contactUs(
    @AuthenticatedUser() user: LoggedUser,
    @UploadedFile() file: Express.Multer.File,
    @Body() data: ContactRequest,
  ): Promise<string> {
    const contactUser: ContactUser = { id: user.preferredUsername, name: user.displayName, email: user.email };
    return this.contactusService.contactUs(contactUser, data, file);
  }
}
