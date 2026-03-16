import { getDomainWithClassifications } from "@api/domains";
import { GeneralForm } from "@components/Popup";
import { SearchField } from "@components/SearchField";
import { DOMAINS_ENDPOINT } from "@constants";
import { CircularProgress, Dialog, FormControl, FormGroup, FormLabel, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { FormEvent, useMemo, useState } from "react";
import CheckboxesFixedSizeList, { CheckboxListItem } from "../CheckboxesFixedSizeList";
import { useCheckboxState } from "@helpers/useCheckboxState";
import { TUserDomainListItem, UserDomainsProps } from "./UserDomains";
import { hasNonDirectSources, hasDirectSource } from "@helpers/permissionSources";
import { UserDomainDto } from "@types";
import { OptionalPath } from "@port/common-schemas";

interface AddClassificationsPopupProps extends Pick<UserDomainsProps, "domainsOptionsMap"> {
  domainId: string;
  open: boolean;
  onClose: () => void;
  handleSave: (classifications: UserDomainDto["classifications"]) => void;
  initialSelectedClassifications: OptionalPath<TUserDomainListItem["classifications"], [number, "sources"]>;
}

const AddClassificationsPopup = ({
  open,
  onClose,
  handleSave,
  domainId,
  initialSelectedClassifications,
  domainsOptionsMap,
}: AddClassificationsPopupProps) => {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const { checkedValues, handleCheckboxChange } = useCheckboxState<string>(new Set(initialSelectedClassifications.map(({ _id }) => _id)));
  const {
    data: domainWithClassifications,
    isError,
    isLoading,
  } = useQuery({
    queryKey: [DOMAINS_ENDPOINT, "id", domainId, "with-classifications"],
    queryFn: async () => {
      return await getDomainWithClassifications(domainId);
    },
    meta: {
      loading: false,
    },
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const newClassifications =
      domainWithClassifications?.classifications?.reduce<UserDomainDto["classifications"]>((acc, option) => {
        const classification = initialSelectedClassifications.find(({ _id }) => option._id === _id);

        if (checkedValues.has(option._id) && (!classification || !classification.sources || hasDirectSource(classification.sources))) {
          acc.push(option);
        }
        return acc;
      }, []) ?? [];

    handleSave(newClassifications);
    onClose();
  };

  const authorizedClassifications = useMemo(() => new Set(domainsOptionsMap.get(domainId)?.classifications), [domainsOptionsMap, domainId]);

  const filteredOptions = useMemo(() => {
    if (!domainWithClassifications) {
      return [];
    }

    return domainWithClassifications.classifications.reduce<CheckboxListItem<string>[]>((acc, option) => {
      if (!searchTerm || option.name.toLowerCase().includes(searchTerm.toLowerCase())) {
        acc.push({
          value: option._id,
          label: option.name,
          disabled:
            !authorizedClassifications.has(option._id) ||
            hasNonDirectSources(initialSelectedClassifications.find(({ _id }) => option._id === _id)?.sources ?? []),
        });
      }
      return acc;
    }, []);
  }, [domainWithClassifications, searchTerm, authorizedClassifications, initialSelectedClassifications]);

  return (
    <Dialog open={open} onClose={onClose} hideBackdrop={true}>
      <GeneralForm
        style={{
          border: 1,
          borderRadius: 2,
          borderColor: "#EAECF0",
        }}
        cancel={() => {
          onClose();
        }}
        onSubmit={handleSubmit}
        disableSave={isError || checkedValues.size === 0}
      >
        <FormControl sx={{ overflowY: "hidden", minHeight: "55vh", width: "35vh" }}>
          <FormLabel component="legend">בחר הרשאה</FormLabel>

          <FormGroup sx={{ width: "50%" }}>
            <SearchField handleSearch={setSearchTerm} />
          </FormGroup>
          {isError ? (
            <Typography color="red">שגיאה בעת טעינת הסיווגים</Typography>
          ) : isLoading ? (
            <CircularProgress />
          ) : (
            <FormGroup sx={{ width: "35vh", height: 500 }}>
              <CheckboxesFixedSizeList items={filteredOptions} checkedValues={checkedValues} handleCheckboxChange={handleCheckboxChange} />
            </FormGroup>
          )}
        </FormControl>
      </GeneralForm>
    </Dialog>
  );
};

export default AddClassificationsPopup;
