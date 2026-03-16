import OverflowChipList, { ChipItem } from "../OverflowChipList";
import { Box, Grid, IconButton, Typography } from "@mui/material";
import { PencilSimple, TrashSimple } from "@phosphor-icons/react";
import { useMemo } from "react";
import { UserDomainsListProps } from "./UserDomainsList";
import { ObjectIdBrand } from "@port/shield-schemas";
import { formatNonDirectSources, getNonDirectSources, hasNonDirectSources } from "@helpers/permissionSources";

export interface UserDomainListItemProps
  extends Pick<
    UserDomainsListProps,
    "domainsOptionsMap" | "handleOpenEditPopup" | "handleOpenDeletedPopup" | "handleDeleteClassifications" | "disableEdit"
  > {
  domain: UserDomainsListProps["userDomains"][number];
}

export const UserDomainListItem = ({
  domain,
  domainsOptionsMap,
  handleOpenEditPopup,
  handleOpenDeletedPopup,
  handleDeleteClassifications,
  disableEdit,
}: UserDomainListItemProps) => {
  const classificationChips: ChipItem<ObjectIdBrand>[] = useMemo(() => {
    const classificationsOptionsSet = new Set(domainsOptionsMap.get(domain.id)?.classifications);
    const chips = domain.classifications.map((c) => {
      const nonDirectSources = getNonDirectSources(c.sources);

      return {
        id: c._id,
        label: c.name,
        disabled: disableEdit || !classificationsOptionsSet.has(c._id) || nonDirectSources.length > 0,
        extraInfo: formatNonDirectSources(nonDirectSources),
      };
    });

    return chips.sort((a, b) => Number(a.disabled) - Number(b.disabled));
  }, [disableEdit, domain.classifications, domain.id, domainsOptionsMap]);

  // disabled if forced disabled doesn't have permission to domain or has 0 classifications
  const isDisabled = disableEdit || !domainsOptionsMap.get(domain.id)?.classifications.length;

  return (
    <Grid container alignItems="center" minHeight={59}>
      <Grid item xs={11}>
        <Box sx={{ my: 1.5, ml: 1 }}>
          <OverflowChipList
            chips={classificationChips}
            placeholder={
              <Typography width="100%" textAlign="center" variant="body2" color="gray">
                לא הוחלו סיווגים
              </Typography>
            }
            titleProps={{ itemSize: 3.5, text: domain.display_name }}
            handleChipDelete={(id) => handleDeleteClassifications([id], domain.id)}
            chipProps={{ variant: "outlined" }}
          />
        </Box>
      </Grid>
      <Grid item xs={0.5} display="flex" justifyContent="center" alignItems="center">
        <IconButton
          sx={{ outlineColor: "primary.main" }}
          color="primary"
          size="small"
          onClick={() => handleOpenDeletedPopup(domain)}
          disabled={isDisabled || hasNonDirectSources(domain.sources)}
        >
          <TrashSimple size={16} />
        </IconButton>
      </Grid>
      <Grid item xs={0.5} display="flex" justifyContent="center" alignItems="center">
        <IconButton
          sx={{ outlineColor: "primary.main" }}
          color="primary"
          size="small"
          onClick={() => handleOpenEditPopup(domain)}
          disabled={isDisabled}
        >
          <PencilSimple size={16} />
        </IconButton>
      </Grid>
    </Grid>
  );
};
