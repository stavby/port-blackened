import { createDomain, editDomain, getDomainsExcel, getDomainsWithClassifications } from "@api/domains";
import { StyledClassificationChip } from "@components/CardUser";
import { ActionIcons, DataGridFooterWithAddButton, DataGridProComponent } from "@components/DataGrid";
import { NoData } from "@components/NoData";
import DomainPopup from "@components/Popup/DomainPopup";
import { RelatedDomainsList } from "@components/RelatedDomainsList";
import { ScreenTitle } from "@components/ScreenTitle";
import { SearchField } from "@components/SearchField";
import { StickyPageHeader } from "@components/StickyPageHeader";
import { useDatagridPaginationProps } from "@helpers/useDatagridPaginationProps";
import { useGridExternalQuickFilter } from "@helpers/useExternalQuickFilter";
import { AddCircle } from "@mui/icons-material";
import { Box, Button, Grid } from "@mui/material";
import { GridColDef, GridPagination } from "@mui/x-data-grid-pro";
import { BoundingBox } from "@phosphor-icons/react";
import { useSnackBarStore } from "@store/snackbarStore";
import { CreateDomainDto, DomainWithClassification } from "@types";
import { AxiosError } from "axios";
import { saveAs } from "file-saver";
import { useCallback, useEffect, useState } from "react";

const Domains: React.FC = () => {
  const [domainsWithClassifications, setDomainsWithClassifications] = useState<Record<string, DomainWithClassification>>({});
  const [queryState, setQueryState] = useState<"loading" | "error" | "success">("loading");
  const [isDomainPopupOpen, setDomainPopupOpen] = useState(false);
  const [selectedDomainId, setSelectedDomainId] = useState<string | null>(null);
  const paginationProps = useDatagridPaginationProps();
  const { gridApiRef, handleSearch } = useGridExternalQuickFilter();
  const { setSnackbarSuccess, setSnackbarError } = useSnackBarStore((state) => ({
    setSnackbarSuccess: state.setSnackbarSuccess,
    setSnackbarError: state.setSnackbarError,
  }));

  const fetchDomains = useCallback(() => {
    getDomainsWithClassifications()
      .then((domains) => {
        setDomainsWithClassifications(
          domains.reduce((acc, domain) => ({ ...acc, [domain._id]: domain }), {} as Record<string, DomainWithClassification>),
        );
        setQueryState("success");
      })
      .catch(() => {
        setSnackbarError("לא ניתן היה להשיג את עולמות התוכן");
        setQueryState("error");
      });
  }, [setSnackbarError]);

  useEffect(() => {
    fetchDomains();
  }, [fetchDomains]);

  const onSubmit = useCallback(
    (domain: CreateDomainDto) => {
      if (selectedDomainId) {
        editDomain(selectedDomainId, { display_name: domain.display_name, classifications: domain.classifications })
          .then(() => {
            setSnackbarSuccess("עולם התוכן עודכן בהצלחה");
            fetchDomains();
          })
          .catch((error) => {
            const message = error instanceof AxiosError ? error.response?.data?.message : undefined;
            setSnackbarError(message ?? "קרתה תקלה בעדכון עולם התוכן", "שגיאה");
          });
      } else {
        createDomain(domain)
          .then(() => {
            setSnackbarSuccess("עולם התוכן נוצר בהצלחה");
            fetchDomains();
          })
          .catch((error) => {
            const message = error instanceof AxiosError ? error.response?.data?.message : undefined;
            setSnackbarError(message ?? "קרתה תקלה ביצירת עולם התוכן", "שגיאה");
          });
      }
      setDomainPopupOpen(false);
      setSelectedDomainId(null);
    },
    [selectedDomainId, setSnackbarSuccess, fetchDomains, setSnackbarError],
  );

  const columns: GridColDef<DomainWithClassification>[] = [
    {
      field: "display_name",
      headerName: "שם עולם תוכן",
      flex: 0.5,
      renderCell: ({ row: { display_name } }) => <StyledClassificationChip label={display_name} />,
    },
    {
      field: "classifications",
      headerName: "סיווגים",
      flex: 2,
      renderCell: ({ row: { classifications } }) => (
        <RelatedDomainsList related_domains={classifications.map(({ _id, name }) => ({ _id, display_name: name }))} />
      ),
      getApplyQuickFilterFn: (value: string) => {
        return ({ row: { classifications } }) => {
          const valueLower = value.toLowerCase();
          return (classifications ?? []).some(({ name }) => name.includes(valueLower));
        };
      },
    },
    {
      field: "actions",
      headerName: "",
      flex: 0.11,
      sortable: false,
      filterable: false,
      renderCell: ({ row: { _id } }) => (
        <ActionIcons
          id={_id}
          edit={(id) => {
            setSelectedDomainId(id);
            setDomainPopupOpen(true);
          }}
        />
      ),
    },
  ];

  const exportToExcel = async () => {
    try {
      const domainExcelFile = await getDomainsExcel();
      saveAs(domainExcelFile, `ניהול_עולמות_תוכן.xlsb`);
    } catch (error) {
      console.log(error);
      setSnackbarError("שגיאה בעת טעינת אקסל");
    }
  };

  return (
    <Box>
      <StickyPageHeader>
        <ScreenTitle
          screenName="ניהול עולמות תוכן"
          screenIcon={<BoundingBox color="#5f5858" fontSize={25} weight="thin" style={{ marginLeft: 5 }} />}
        />
        <Grid container justifyContent="space-between" columnSpacing={1} marginBottom="15px">
          <Grid item xs={10} textAlign="left">
            <SearchField handleSearch={handleSearch} />
          </Grid>
          <Grid item xs={1} textAlign="right">
            <Button
              variant="contained"
              color="light"
              fullWidth
              onClick={() => setDomainPopupOpen(true)}
              startIcon={<AddCircle color="primary" />}
              sx={{
                border: "1px solid #dfe9f1",
              }}
            >
              הוספה
            </Button>
          </Grid>
          <Grid item xs={1} textAlign="right">
            <Button variant="contained" color="primary" onClick={exportToExcel}>
              <AddCircle />
              ייצוא לאקסל
            </Button>
          </Grid>
        </Grid>
      </StickyPageHeader>
      <DataGridProComponent
        footer={() => (
          <DataGridFooterWithAddButton
            iconButtonProps={{
              onClick: () => setDomainPopupOpen(true),
            }}
          >
            <GridPagination />
          </DataGridFooterWithAddButton>
        )}
        apiRef={gridApiRef}
        rows={Object.values(domainsWithClassifications)}
        columns={columns}
        disableColumnSelector
        loading={queryState === "loading"}
        autoHeight
        {...paginationProps}
        slots={{
          noRowsOverlay: () => <NoData mainText="לא נמצאו עולמות תוכן" secondaryText="אולי כדאי לחפש משהו אחר :)" sx={{ mx: "auto" }} />,
          noResultsOverlay: () => <NoData mainText="לא נמצאו עולמות תוכן" secondaryText="אולי כדאי לחפש משהו אחר :)" sx={{ mx: "auto" }} />,
        }}
        sx={{
          bgcolor: "white",
          "--DataGrid-overlayHeight": "400px",
        }}
      />
      {isDomainPopupOpen && (
        <DomainPopup
          onClose={() => {
            setDomainPopupOpen(false);
            setSelectedDomainId(null);
          }}
          open={isDomainPopupOpen}
          onSubmit={onSubmit}
          domain={selectedDomainId ? domainsWithClassifications[selectedDomainId] : undefined}
        />
      )}
    </Box>
  );
};

export default Domains;
