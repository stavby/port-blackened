import { HttpException, HttpStatus } from "@nestjs/common";
import { isFormattedAxiosError } from "@port/utils";
import Axios, { AxiosError } from "axios";

type FormattedError = { httpStatus: HttpStatus; error: any };

export class ExtractDataFromError {
  static extractDataFromError(exception: unknown): FormattedError {
    if (Axios.isAxiosError(exception)) return this.extractDataFromAxiosError(exception);

    if (isFormattedAxiosError(exception)) return { httpStatus: exception.status ?? HttpStatus.INTERNAL_SERVER_ERROR, error: exception };

    if (exception instanceof HttpException) return { httpStatus: exception.getStatus(), error: exception.getResponse() };

    return { httpStatus: HttpStatus.INTERNAL_SERVER_ERROR, error: exception };
  }

  static extractDataFromAxiosError(exception: AxiosError): FormattedError {
    const responseType = exception?.config?.responseType;

    // Array Buffer Axios - Convert to string
    if (responseType === "arraybuffer") {
      const responseData = exception.response?.data;
      const decodeArrayBuffer = new TextDecoder("utf-8").decode(responseData as any);
      const error = JSON.parse(decodeArrayBuffer);

      return { httpStatus: error.originalError.statusCode, error: error.message };
    }

    // If it's not an arraybuffer axios request - return as-is.
    return { httpStatus: exception.response?.status ?? HttpStatus.INTERNAL_SERVER_ERROR, error: exception };
  }
}
