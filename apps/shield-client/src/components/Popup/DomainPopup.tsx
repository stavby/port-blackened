import { getPermissions } from "@api/permissions";
import { Checkbox, CircularProgress, FormControl, InputLabel, ListItemText, MenuItem, Select, TextField } from "@mui/material";
import { CreateDomainDto, DomainWithClassification, Permission } from "@types";
import { useEffect, useMemo, useState } from "react";
import { GeneralForm, GeneralFormProps } from "./GeneralForm";
import { GeneralPopup, GeneralPopupProps } from "./GeneralPopup";
import { BoundingBox } from "@phosphor-icons/react/dist/ssr";
import { ObjectIdBrand } from "@port/shield-schemas";
import { useQuery } from "@tanstack/react-query";

interface GeneralDomainPopupProps
  extends Omit<GeneralPopupProps, "onSubmit" | "style" | "children" | "titleIcon" | "title">,
    Omit<GeneralFormProps, "onSubmit" | "style" | "children" | "cancel"> {}

type DomainPopupProps = GeneralDomainPopupProps & {
  domain?: DomainWithClassification;
  onSubmit: (value: CreateDomainDto) => void;
};

const DomainPopup = ({ open, onClose, onSubmit, domain }: DomainPopupProps) => {
  const [classifications, setClassifications] = useState<Record<string, Permission>>({});

  const { data: permissions, isLoading: isLoadingPermissions } = useQuery({
    queryKey: ["permissions"],
    queryFn: getPermissions,
    meta: {
      loading: false,
    },
  });

  const editDomainClassifications = useMemo<Set<ObjectIdBrand>>(() => {
    if (domain) {
      return new Set(domain.classifications.map(({ _id }) => _id));
    } else {
      return new Set<ObjectIdBrand>([]);
    }
  }, [domain]);

  const [selectedClassifications, setSelectedClassifications] = useState<string[]>(
    domain ? domain.classifications.map(({ _id }) => _id) : [],
  );

  useEffect(() => {
    if (!permissions) {
      return;
    }

    setClassifications(
      permissions.reduce((acc, permission) => ({ ...acc, [permission._id]: permission }), {} as Record<string, Permission>),
    );
  }, [permissions]);

  return (
    <GeneralPopup
      open={open}
      onClose={onClose}
      title={domain ? "עריכת עולם תוכן" : "יצירת עולם תוכן"}
      titleIcon={
        <BoundingBox
          color="#fff"
          fontSize={25}
          style={{
            padding: 2,
            borderRadius: 2,
            marginLeft: 7,
            backgroundColor: "#FC5367",
          }}
        />
      }
    >
      <GeneralForm
        onSubmit={(event) => {
          event.preventDefault();
          const formData = new FormData(event.currentTarget);
          const submittedDomain: CreateDomainDto = {
            name: String(formData.get("name")),
            display_name: String(formData.get("display_name")),
            classifications: String(formData.get("classifications")).split(",") as ObjectIdBrand[],
          };

          onSubmit(submittedDomain);
        }}
        cancel={onClose}
        style={{ display: "flex", flexDirection: "column", gap: 2, width: "26vw" }}
      >
        <TextField
          name="name"
          label="שם טכני"
          required
          defaultValue={domain ? domain.name : undefined}
          disabled={!!domain}
          fullWidth
          inputProps={{ pattern: "^[a-z]+(_[a-z]+)*$", title: "Name should be in snake case" }}
        />
        <TextField
          name="display_name"
          label="שם עולם תוכן"
          required
          defaultValue={domain ? domain.display_name : undefined}
          fullWidth
          inputProps={{ pattern: "^\\S.*\\S$|^\\S$", title: "No leading or trailing spaces allowed" }}
        />
        <FormControl fullWidth>
          <InputLabel id="classifications-select-label">סיווגים</InputLabel>
          <Select
            labelId="classifications-select-label"
            label="סיווגים"
            name="classifications"
            value={selectedClassifications}
            multiple
            required
            onChange={({ target: { value } }) => {
              setSelectedClassifications(typeof value === "string" ? value.split(",") : value);
            }}
            renderValue={(ids) =>
              isLoadingPermissions ? <CircularProgress size={30} /> : ids.map((id) => classifications[id]?.name).join(", ")
            }
            MenuProps={{
              PaperProps: {
                style: {
                  direction: "rtl",
                  maxHeight: 224,
                },
              },
            }}
          >
            {Object.values(classifications).map(({ _id, name }) => (
              <MenuItem key={_id} value={_id} disabled={editDomainClassifications.has(_id)}>
                <Checkbox checked={selectedClassifications.includes(_id)} />
                <ListItemText primary={name} />
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </GeneralForm>
    </GeneralPopup>
  );
};

export default DomainPopup;
