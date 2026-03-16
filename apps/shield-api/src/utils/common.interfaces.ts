import { FORM_DATA_JSON_BODY, FILE_NAME } from "./constants";

interface FormDataInterface<T> {
  [FORM_DATA_JSON_BODY]: T;
  [FILE_NAME]?: Express.Multer.File;
}

type FormattedAxiosError = {
  service: string;
  time: string;
  method: string;
  url: string;
  params: any;
  status: number;
  code: string;
  errorData: unknown;
};

export { FormDataInterface, FormattedAxiosError };
