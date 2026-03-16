import { Query, QueryKey, Mutation } from "@tanstack/react-query";
import { HttpStatusCode } from "axios";
import Swal from "sweetalert2";
import { DEFAULT_ERROR_MESSAGE } from "./constants.ts";

export const callUnautherizedSwal = async (login: () => unknown) => {
  const swalRes = await Swal.fire({
    text: "נראה שאתם לא מחוברים למערכת",
    title: "אופס!",
    icon: "error",
    confirmButtonText: "התחברות מחדש",
    confirmButtonColor: "#1573FE",
  });
  if (swalRes.isConfirmed) login();
};

export const toast = Swal.mixin({
  toast: true,
  position: "top",
  iconColor: "white",
  showConfirmButton: false,
  timer: 2000,
  timerProgressBar: true,
  customClass: { popup: "colored-toast" },
});

export const defaultOnError = (
  error: { message: string; statusCode: number; timeShownInMillis?: number },
  loginCallback: () => unknown,
  query?: Query<unknown, unknown, unknown, QueryKey> | Mutation<unknown, unknown, unknown, unknown>,
) => {
  if (query?.meta?.useDefaultOnError === false) {
    return;
  }

  if (error.statusCode === HttpStatusCode.Unauthorized) {
    callUnautherizedSwal(loginCallback);
  } else {
    const message = error.message ?? DEFAULT_ERROR_MESSAGE;
    toast.fire({ html: message, icon: "error", ...(error.timeShownInMillis ? { timer: error.timeShownInMillis } : {}) });
  }
};
