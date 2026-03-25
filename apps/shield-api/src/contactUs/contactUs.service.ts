import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import axios, { AxiosError, AxiosInstance, AxiosResponse } from "axios";
import { Agent } from "https";
import { Readable } from "stream";
import { ContactUser } from "./contactUs.interfaces";
import { ContactFields, ContactRequest, RequestType, ValidValues } from "./contactUs.models";
import { readServerFile } from "@port/server-files";
import { IORedis } from "src/redis/ioredis";
import { REDIS_KEYS } from "src/redis/ioredis.keys";
import { formatAxiosError } from "@port/utils";
const FormData = require("form-data");

@Injectable()
export class ContactUsService {
  private readonly jira_url = process.env.JIRA_URL ?? "";
  private readonly jira_user = process.env.JIRA_USER ?? "";
  private readonly jira_pass = process.env.JIRA_PASSWORD ?? "";
  private readonly jira_desk = process.env.JIRA_DESK_ID ?? 55;
  private readonly jira_group = process.env.JIRA_GROUP_ID ?? 216;
  private readonly jira_api: AxiosInstance;

  constructor(private readonly ioredis: IORedis) {
    this.jira_api = axios.create({
      baseURL: this.jira_url,
      auth: { username: this.jira_user, password: this.jira_pass },
      // httpsAgent: new Agent({ rejectUnauthorized: true, ca: [readServerFile("")] }),
      // BLACKEND
      httpsAgent: new Agent({ rejectUnauthorized: false }),
    });

    this.jira_api.interceptors.response.use(
      (res) => res,
      (error: AxiosError) => {
        return Promise.reject(formatAxiosError(ContactUsService.name, error));
      },
    );
  }

  async contactUs(user: ContactUser, requestData: ContactRequest, file: Express.Multer.File | undefined): Promise<string> {
    const payload = {
      serviceDeskId: this.jira_desk,
      requestTypeId: requestData.requestType.id,
      requestFieldValues: {
        summary: requestData.summary,
        description: requestData.description,
        ...(requestData.customfield_10706
          ? { customfield_10706: { value: requestData.customfield_10706, id: requestData.customfield_10706 } }
          : {}),
        ...(requestData.customfield_14200
          ? { customfield_14200: { value: requestData.customfield_14200, id: requestData.customfield_14200 } }
          : {}),
        ...(requestData.customfield_11502 ? { customfield_11502: Number(requestData.customfield_11502) } : {}),
      },
      raiseOnBehalfOf: user.id,
    };

    let res: AxiosResponse<any, any>;
    try {
      res = await this.jira_api.post(`rest/servicedeskapi/request`, payload);
    } catch (error) {
      throw new HttpException("נראה שהתקלה היא אצלינו<br>אם זו לא הפעם הראשונה דברו איתנו", HttpStatus.INTERNAL_SERVER_ERROR, {
        cause: error,
      });
    }
    if (file) {
      try {
        const fileName = Buffer.from(file.originalname, "latin1").toString("utf8");
        const issueId = res.data.issueId;
        const formData = new FormData();
        const fileStream = Readable.from(file.buffer);
        formData.append("file", fileStream, { filename: fileName, contentType: file.mimetype, knownLength: file.size });
        await this.jira_api.post(`rest/api/2/issue/${issueId}/attachments`, formData, { headers: { "X-Atlassian-Token": "no-check" } });
      } catch (error) {
        throw new HttpException(
          {
            message: "הפנייה נפתחה בג'ירה אך הקובץ לא הצליח לעלות אם תרצה תוכל להעלות ידנית בעצמך",
            link: res.data._links.web,
          },
          HttpStatus.INTERNAL_SERVER_ERROR,
          { cause: error },
        );
      }
    }

    return res.data._links.web;
  }

  async getContactTypes(): Promise<RequestType[]> {
    try {
      const redisValue = await this.ioredis.get(REDIS_KEYS.JIRA_CONTACT_TYPES);
      if (redisValue) return JSON.parse(redisValue);

      const res = await this.jira_api.get<
        | {
            values: {
              id: string;
              name: string;
            }[];
          }
        | undefined
      >(`rest/servicedeskapi/servicedesk/${this.jira_desk}/requesttype`, {
        params: { limit: 100, groupId: this.jira_group },
      });

      const request_types: RequestType[] = await Promise.all(
        res.data?.values.map(async (request_type): Promise<RequestType> => {
          const fieldsRes = await this.jira_api.get<
            | {
                requestTypeFields?: {
                  fieldId: ContactFields;
                  name: string;
                  jiraSchema?: { type: string };
                  required: boolean;
                  validValues?: ValidValues[];
                }[];
              }
            | undefined
          >(`rest/servicedeskapi/servicedesk/${this.jira_desk}/requesttype/${request_type.id}/field`);
          return {
            id: request_type.id,
            name: request_type.name,
            fields:
              fieldsRes.data?.requestTypeFields?.map<RequestType["fields"][number]>((field) => ({
                fieldId: field.fieldId,
                name: field.name,
                type: field.jiraSchema?.type ?? "unknown",
                required: field.required,
                validValues: field.validValues ?? [],
              })) ?? [],
          };
        }) ?? [],
      );

      this.ioredis.set(REDIS_KEYS.JIRA_CONTACT_TYPES, JSON.stringify(request_types), "EX", 60 * 60);

      return request_types;
    } catch (error) {
      throw new HttpException("נראה שהתקלה היא אצלינו<br>אם זו לא הפעם הראשונה דברו איתנו", HttpStatus.INTERNAL_SERVER_ERROR, {
        cause: error,
      });
    }
  }
}
