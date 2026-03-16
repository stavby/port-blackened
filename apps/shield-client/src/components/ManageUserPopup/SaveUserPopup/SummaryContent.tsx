import DomainsIcon from "@assets/icons/DomainsIcon";
import TablesIcon from "@assets/icons/TablesIcon";
import { Box, Grid, Stack, Typography, TypographyProps } from "@mui/material";
import { MergedClientUser } from "@types";
import { ReactNode, useMemo } from "react";
import OverflowChipList, { ChipItem, TitleStyled } from "../OverflowChipList";
import { TUserDomainListItem } from "../UserDomains";
import { FormattedPermissionTable, FormattedRowFilter } from "../diff.utils";

type SummaryUserAttributesProps = {
  attributes: MergedClientUser["attributes"];
};

export const SummaryTitle = ({ children }: { children: ReactNode }) => (
  <Typography variant="subtitle1" sx={{ fontWeight: "bold", fontSize: 20 }}>
    {children}
  </Typography>
);

export const SummarySubtitle = ({ children, ...props }: TypographyProps) => (
  <Typography {...props} variant="subtitle2" sx={{ color: "primary.main", fontSize: 18 }}>
    {children}
  </Typography>
);

export const SummaryUserAttributes = ({ attributes }: SummaryUserAttributesProps) => {
  const { type, mask, unique_population, deceased_population } = attributes;

  return (
    <>
      <Stack direction={"row"} spacing={1} sx={{ alignItems: "center" }}>
        <Typography variant="subtitle2">סוג משתמש:</Typography>
        <Typography variant="caption">{type}</Typography>
      </Stack>
      <Stack direction={"row"} spacing={1} sx={{ alignItems: "center" }}>
        <Typography variant="subtitle2">התממה:</Typography>
        <Typography variant="caption">{mask ? "עם התממה" : "ללא התממה"}</Typography>
      </Stack>
      <Stack direction={"row"} spacing={1} sx={{ alignItems: "center" }}>
        <Typography variant="subtitle2">אוכלוסיות מיוחדות:</Typography>
        <Typography variant="caption">{unique_population ? "אוכלוסיות מיוחדות" : "ללא אוכלוסיות מיוחדות"}</Typography>
      </Stack>
      <Stack direction={"row"} spacing={1} sx={{ alignItems: "center" }}>
        <Typography variant="subtitle2">אוכלוסיית נפטרים:</Typography>
        <Typography variant="caption">{deceased_population ? "אוכלוסיית נפטרים" : "ללא נפטרים"}</Typography>
      </Stack>
    </>
  );
};

type SummaryDomainProps = {
  displayName: string;
  newClassifications: TUserDomainListItem["classifications"];
  deletedClassifications?: TUserDomainListItem["classifications"];
};

export const SummaryDomain = ({ displayName, newClassifications, deletedClassifications }: SummaryDomainProps) => {
  const newClassificationsChips = newClassifications.map<ChipItem<string>>((classification) => ({
    id: classification._id,
    label: classification.name,
  }));

  const deletedClassificationsChips =
    deletedClassifications?.map<ChipItem<string>>((classification) => ({
      id: classification._id,
      label: classification.name,
    })) ?? [];

  return (
    <Grid container spacing={1} width="100%">
      <Grid item xs={12} display="flex" alignItems="center" gap={0.5}>
        <DomainsIcon />
        <SummarySubtitle my={1}>{displayName}</SummarySubtitle>
      </Grid>

      {newClassificationsChips.length > 0 && (
        <Grid item xs={12}>
          <OverflowChipList chips={newClassificationsChips} chipProps={{ color: "success", variant: "outlined" }} />
        </Grid>
      )}
      {deletedClassificationsChips.length > 0 && (
        <Grid item xs={12}>
          <OverflowChipList chips={deletedClassificationsChips} chipProps={{ color: "error", variant: "outlined" }} />
        </Grid>
      )}
    </Grid>
  );
};

type SummaryRowFilterProps = {
  rowFilter: FormattedRowFilter;
};

const SummaryRowFilter = ({ rowFilter }: SummaryRowFilterProps) => {
  const newValuesChips = useMemo(() => {
    return rowFilter.newValues.map(({ value, display_name }) => ({
      id: value,
      label: display_name,
    }));
  }, [rowFilter]);

  const deletedValuesChips = useMemo(() => {
    return (
      rowFilter.deletedValues?.map(({ value, display_name }) => ({
        id: value,
        label: display_name,
      })) ?? []
    );
  }, [rowFilter]);

  return (
    <Grid container spacing={1} justifyContent="flex-end" width="100%" pt={1}>
      <Grid item xs={2} display="flex" alignItems="flex-start">
        <TitleStyled label={rowFilter.display_name} />
      </Grid>

      {newValuesChips.length > 0 && (
        <Grid item xs={10}>
          <OverflowChipList chips={newValuesChips} chipProps={{ sx: { color: "green" } }} />
        </Grid>
      )}
      {deletedValuesChips.length > 0 && (
        <Grid item xs={10}>
          <OverflowChipList chips={deletedValuesChips} chipProps={{ sx: { color: "red" } }} />
        </Grid>
      )}
    </Grid>
  );
};

type SummaryPermissionTableProps = {
  userPermissionTable: FormattedPermissionTable;
};

export const SummaryPermissionTable = ({ userPermissionTable }: SummaryPermissionTableProps) => {
  return (
    <Box width="100%">
      <Box display="flex" alignItems="center" gap={0.5}>
        <TablesIcon />
        <SummarySubtitle my={1}>{userPermissionTable.display_name}</SummarySubtitle>
      </Box>
      {userPermissionTable.row_filters.map(
        (rowFilter) =>
          (rowFilter.newValues.length > 0 || (rowFilter.deletedValues && rowFilter.deletedValues.length > 0)) && (
            <SummaryRowFilter key={rowFilter.kod} rowFilter={rowFilter} />
          ),
      )}
    </Box>
  );
};
