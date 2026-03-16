import { isFormattedAxiosError } from "@port/utils";
import Axios from "axios";

export const getErrorMessage = (error: unknown) => {
  if (typeof error === "string") return error;

  if (!Axios.isAxiosError(error) || isFormattedAxiosError(error)) return "שגיאה פנימית";

  if (error.response && error.response?.status < 500) return error.response.data.message;

  return "שגיאת שרת";
};
