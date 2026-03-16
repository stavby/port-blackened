import { ContactRequest } from "src/contactUs/contactUs.models";

const shouldValidateContactField = (request: ContactRequest, key: keyof ContactRequest): boolean => {
  const field = request.requestType.fields.find((field) => field.fieldId === key);
  return !!field && (field.required || !!request[key]);
};

export { shouldValidateContactField };
