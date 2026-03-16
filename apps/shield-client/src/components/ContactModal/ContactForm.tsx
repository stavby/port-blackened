import { classValidatorResolver } from "@hookform/resolvers/class-validator";
import { Container, FormControl, FormHelperText, FormLabel, Grid, Typography } from "@mui/material";
import { useMutation } from "@tanstack/react-query";
import { UseControllerReturn, useController, useForm } from "react-hook-form";
import Swal from "sweetalert2";
import { contactUs } from "@api/contact";
import { ContactRequest, RequestType } from "../../types/contact.models";
import CustomRadioGroup from "../CustomRadioGroup";
import { formLabelProps } from "./props";
import { CustomException } from "../../types/interfaces";
import { FieldInput } from "./ContactInputs";
import { DEFAULT_ERROR_MESSAGE } from "@port/utils/constants";

interface ContactFormProps {
  onClose: () => void;
  requestTypes: RequestType[];
}

const fieldSortOrder: RequestType["fields"][number]["fieldId"][] = [
  "customfield_14200",
  "summary",
  "customfield_10706",
  "customfield_11502",
  "attachment",
  "description",
];

const ContactForm = ({ requestTypes, onClose }: ContactFormProps) => {
  const defaultValues = new ContactRequest();
  const form = useForm<ContactRequest>({ mode: "onChange", defaultValues, resolver: classValidatorResolver(ContactRequest) });
  const requestType = form.watch("requestType");
  const requestTypeController = useController({ name: "requestType", control: form.control });

  const controllers = {
    customfield_14200: useController({ name: "customfield_14200", control: form.control }),
    summary: useController({ name: "summary", control: form.control }),
    customfield_10706: useController({ name: "customfield_10706", control: form.control }),
    customfield_11502: useController({ name: "customfield_11502", control: form.control }),
    attachment: useController({ name: "attachment", control: form.control }),
    description: useController({ name: "description", control: form.control }),
  } satisfies Record<RequestType["fields"][number]["fieldId"], UseControllerReturn<ContactRequest, keyof ContactRequest>>;

  const onSubmit = (data: ContactRequest) => {
    const formData = new FormData();
    const { attachment, ...omitFileData } = data;
    formData.append("json_data", JSON.stringify(omitFileData));
    if (attachment) {
      formData.append("file", attachment);
    }
    contactUsMutation.mutate(formData);
  };

  const handleSuccess = async (data: string) => {
    if (data) {
      const swalRes = await Swal.fire({
        text: "פנייתכם נשלחה בג'ירה!",
        title: "איזה כיף!",
        icon: "success",
        confirmButtonText: "מעבר לפנייה",
        confirmButtonColor: "#0d6efd",
      });

      if (swalRes.isConfirmed) {
        window.open(data, "_blank");
      }
    }
    onClose();
  };

  const handleError = async (error: CustomException) => {
    if (error?.link && typeof error.link === "string") {
      const swalRes = await Swal.fire({
        text: error.message,
        title: "!אופס",
        icon: "error",
        confirmButtonText: "מעבר לפנייה",
        confirmButtonColor: "#0d6efd",
      });
      if (swalRes.isConfirmed) {
        window.open(error.link, "_blank");
      }
    } else {
      const message = error.message ?? DEFAULT_ERROR_MESSAGE;
      Swal.fire({
        text: message,
        icon: "error",
      });
    }
  };

  const contactUsMutation = useMutation({
    mutationFn: (contactRequest: FormData) => contactUs(contactRequest),
    onSuccess: (data) => {
      handleSuccess(data);
    },
    onError: (error: CustomException) => {
      handleError(error);
    },
  });

  const requestTypeRadioOptions = requestTypes.map((requestType) => ({
    value: requestType.id,
    label: (
      <Typography fontWeight="bolder" fontSize={14}>
        {requestType.name}
      </Typography>
    ),
  }));

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} id="contactForm">
      <Container sx={{ width: "80%" }}>
        <Grid container rowSpacing={3}>
          <Grid item xs={12}>
            <Typography pt={2} variant="subtitle1">
              כאן תוכלו לפתוח פנייה על תקלה, או לשאול כל שאלה ונחזור אליכם בהקדם!
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <FormControl fullWidth>
              <FormLabel required {...formLabelProps}>
                למה אתם פה?
              </FormLabel>
              <CustomRadioGroup
                id="requestType"
                name={requestTypeController.field.name}
                value={requestTypeController.field.value.id}
                onChange={(event) => {
                  const newRequestType = requestTypes.find((type) => type.id === event.target.value);
                  requestTypeController.field.onChange(newRequestType);
                  const customfield_14200 = newRequestType?.fields.find((field) => field.fieldId === "customfield_14200");
                  if (customfield_14200 && !form.getValues("customfield_14200")) {
                    form.resetField("customfield_14200", {
                      defaultValue: customfield_14200.validValues.find((val) => val.label.toLowerCase().includes("shield"))?.value,
                    });
                  }
                }}
                dimensions={{ width: "95%", height: "60px" }}
                labelColor={{ checked: "primary.main", unchecked: "black" }}
                gridContainerProps={{ width: "100%", justifyContent: "space-between" }}
                gridItemProps={{ xs: 24 / requestTypeRadioOptions.length, lg: 12 / requestTypeRadioOptions.length }}
                options={requestTypeRadioOptions}
              />
              {!!form.formState.errors.requestType?.id && (
                <FormHelperText error sx={{ direction: "rtl", textAlign: "right", height: 0, my: 0, py: 0 }}>
                  {form.formState.errors.requestType.id.message}
                </FormHelperText>
              )}
            </FormControl>
          </Grid>
          {requestType.fields
            .slice(0)
            .sort((a, b) => fieldSortOrder.indexOf(a.fieldId) - fieldSortOrder.indexOf(b.fieldId))
            .map((field, index) => (
              <Grid item xs={12} key={index}>
                <FieldInput field={field} controller={controllers[field.fieldId]} />
              </Grid>
            ))}
        </Grid>
      </Container>
    </form>
  );
};

export default ContactForm;
