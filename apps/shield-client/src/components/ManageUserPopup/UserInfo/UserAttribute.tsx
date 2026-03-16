import { Chip, CircularProgress, IconButton, Stack, Typography } from "@mui/material";
import { PencilSimple } from "@phosphor-icons/react";
import { AttributeOptions } from "./types";
import { EditUserAttributePopup } from "./EditUserAttributePopup";
import { useMemo, useState } from "react";

type Props<T extends string | number[]> = {
  attribute: T;
  handleSubmitAtrribue: (selectedAttribute: T) => void;
  title: string;
  disabled?: boolean;
  helperText?: string;
  attributeOptions: AttributeOptions[];
  isLoading?: boolean;
};

export const UserAttribute = <T extends string | number[]>({
  attribute,
  handleSubmitAtrribue,
  title,
  attributeOptions,
  helperText,
  disabled = false,
  isLoading = false,
}: Props<T>) => {
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const optionsMap = useMemo(() => new Map(attributeOptions.map((option) => [option.key, option])), [attributeOptions]);

  return (
    <>
      <Typography sx={{ fontWeight: "bold", py: 1 }}>{title}</Typography>
      {isLoading ? (
        <CircularProgress />
      ) : (
        <>
          <Stack alignItems={"center"} justifyContent={"space-between"} direction={"row"} gap={1}>
            <Chip
              label={
                !Array.isArray(attribute)
                  ? optionsMap.get(attribute)?.label
                  : attribute.length > 0
                    ? attribute
                        .map((attr) => optionsMap.get(attr)?.label)
                        .filter((label) => label !== undefined)
                        .join(", ")
                    : `ללא ${title}`
              }
              variant="outlined"
              color="primary"
              onClick={() => setIsPopupOpen(true)}
            />
            <IconButton color="primary" size="small" onClick={() => setIsPopupOpen(true)}>
              {/* <Edit /> */}
              <PencilSimple size={16} />
            </IconButton>
          </Stack>
          <EditUserAttributePopup
            defaultAttribute={attribute}
            title={title}
            open={isPopupOpen}
            onClose={() => setIsPopupOpen(false)}
            handleSubmitAtrribue={handleSubmitAtrribue}
            attributeOptions={attributeOptions}
            disabled={disabled}
            helperText={helperText}
          />
        </>
      )}
    </>
  );
};
