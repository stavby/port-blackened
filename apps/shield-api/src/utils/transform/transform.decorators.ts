import { Transform } from "class-transformer";

export const ToLowerCase = () => {
  return Transform(({ value }) => (typeof value === "string" ? value.toLowerCase() : value));
};
