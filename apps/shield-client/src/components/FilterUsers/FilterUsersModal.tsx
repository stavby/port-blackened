import Modal from "@port/components/modal";
import { Box, Button, FormControlLabel, Grid, IconButton, Paper, Radio, RadioGroup } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import { Typography } from "@mui/material";
import { useMemo, useState } from "react";
import { getDomainsWithClassifications } from "@api/domains";
import { useQuery } from "@tanstack/react-query";
import { FilterUsersInput, UserDomainDto } from "@types";
import { useGetPermissionGroups } from "@api/permissionGroups";
import { userTypes, specialProperties, DomainWithClassificationsDto, AuthorizationSource } from "@port/shield-schemas";
import OverflowChipList from "@components/ManageUserPopup/OverflowChipList";
import FilterOutlinedIcon from "@mui/icons-material/FilterAltOutlined";
import { PencilSimple, TrashSimple } from "@phosphor-icons/react";
import AddClassificationsPopup from "@components/ManageUserPopup/UserDomains/AddClassificationsPopup";
import { GenericAutocomplete } from "./GenericAutocomplete";
import { useHasPermissionsForUniquePopulations } from "@api/users";

export interface FilterUsersModalProps {
  filters: FilterUsersInput;
  setFilters: (filters: FilterUsersInput) => void;
  isFilterModalOpen: boolean;
  onClose: () => void;
}

const FilterUsersModal: React.FC<FilterUsersModalProps> = ({ filters, setFilters, isFilterModalOpen, onClose }) => {
  const { data: hasPermissionsForUniquePopulations } = useHasPermissionsForUniquePopulations();
  const displaySpecialProperties = useMemo(() => {
    if (hasPermissionsForUniquePopulations) {
      return Object.values(specialProperties);
    }
    const { unique_population, ...noUniqePopulations } = specialProperties;
    return Object.values(noUniqePopulations);
  }, [hasPermissionsForUniquePopulations]);

  const [localFilters, setLocalFilters] = useState<FilterUsersInput>(filters);
  const [selectedDomain, setSelectedDomain] = useState<
    | (DomainWithClassificationsDto & {
        selectedClassifications?: UserDomainDto["classifications"];
      })
    | null
  >(null);

  const { data: domainsData } = useQuery({
    queryKey: ["domainsWithClassifications"],
    queryFn: getDomainsWithClassifications,
  });

  const domainsOptionsMap = useMemo(
    () =>
      new Map(
        domainsData?.map((domainOption) => [
          domainOption._id,
          { ...domainOption, classifications: domainOption.classifications.map(({ _id }) => _id) },
        ]),
      ),
    [domainsData],
  );

  const { data: permissionGroupData } = useGetPermissionGroups();

  const saveChanges = () => {
    setFilters(localFilters);
  };

  const deleteChanges = () => {
    setLocalFilters(filters);
  };

  const clearAllFilters = () => {
    setLocalFilters({});
  };

  return (
    <>
      <Modal
        sx={{ width: "40%" }}
        open={isFilterModalOpen}
        closeOnOutsideClick={false}
        onClose={() => {
          onClose();
          deleteChanges();
        }}
        footer={
          <>
            <Button
              sx={{ bgcolor: "#3256df", color: "white", "&:hover": { backgroundColor: "#647bd9" }, ml: 3 }}
              onClick={() => {
                onClose();
                saveChanges();
              }}
            >
              החל סינונים
            </Button>
            <Button
              sx={{ border: 1 }}
              onClick={() => {
                onClose();
                deleteChanges();
              }}
            >
              ביטול
            </Button>
          </>
        }
      >
        <Box marginTop="1rem" marginX="1rem" dir="rtl" display={"flex"} justifyContent={"space-between"}>
          <Box display={"flex"} alignItems={"center"}>
            <FilterOutlinedIcon />
            <Typography fontSize="25px">סינונים</Typography>
          </Box>

          <Button
            sx={{ color: "gray" }}
            onClick={() => {
              onClose();
              deleteChanges();
            }}
          >
            <CloseOutlinedIcon />
          </Button>
        </Box>

        <Box display="flex" flexDirection="column" marginX="2rem" marginTop="2rem" gap="10px" dir="rtl">
          <GenericAutocomplete
            options={userTypes}
            localFilters={localFilters}
            setLocalFilters={setLocalFilters}
            value={localFilters.userTypes ?? []}
            filterKey={"userTypes"}
            title={"סוגי משתמשים"}
          />
          {domainsData && (
            <GenericAutocomplete
              options={domainsData}
              localFilters={localFilters}
              setLocalFilters={setLocalFilters}
              value={localFilters.domains ?? []}
              filterKey={"domains"}
              title={"עולמות תוכן"}
            />
          )}
          {localFilters.domains && localFilters.domains.length > 0 && (
            <Paper variant="outlined" sx={{ marginX: "2rem" }}>
              {localFilters.domains.map((domain) => (
                <Grid container key={domain._id} alignItems="center" minHeight={59}>
                  <Grid item xs={11}>
                    <OverflowChipList
                      chips={
                        domain.selectedClassifications?.map((selectedClassification) => ({
                          id: selectedClassification._id,
                          label: selectedClassification.name,
                        })) || []
                      }
                      placeholder={
                        <Typography width="100%" textAlign="center" variant="body2" color="gray">
                          לא הוחלו סיווגים
                        </Typography>
                      }
                      titleProps={{ itemSize: 3.5, text: domain.display_name }}
                      handleChipDelete={(id) => {
                        setLocalFilters({
                          ...localFilters,
                          domains: localFilters.domains?.map((curDomain) =>
                            curDomain._id === domain._id
                              ? {
                                  ...curDomain,
                                  selectedClassifications: curDomain.selectedClassifications?.filter(
                                    (selectedClassification) => selectedClassification._id !== id,
                                  ),
                                }
                              : curDomain,
                          ),
                        });
                      }}
                      chipProps={{ variant: "outlined" }}
                    />
                  </Grid>
                  <Grid item xs={0.5} display="flex" justifyContent="center" alignItems="center">
                    <IconButton
                      sx={{ outlineColor: "primary.main" }}
                      color="primary"
                      size="small"
                      onClick={() => {
                        setLocalFilters({
                          ...localFilters,
                          domains: localFilters.domains?.map((currDomain) =>
                            domain._id === currDomain._id ? { ...currDomain, selectedClassifications: [] } : currDomain,
                          ),
                        });
                      }}
                    >
                      <TrashSimple size={16} />
                    </IconButton>
                  </Grid>
                  <Grid item xs={0.5} display="flex" justifyContent="center" alignItems="center">
                    <IconButton
                      sx={{ outlineColor: "primary.main" }}
                      color="primary"
                      size="small"
                      onClick={() => setSelectedDomain(domain)}
                    >
                      <PencilSimple size={16} />
                    </IconButton>
                  </Grid>
                </Grid>
              ))}
            </Paper>
          )}
          {permissionGroupData && (
            <GenericAutocomplete
              options={permissionGroupData}
              localFilters={localFilters}
              setLocalFilters={setLocalFilters}
              value={localFilters.permissionGroups ?? []}
              filterKey={"permissionGroups"}
              title={"קבוצות הרשאות"}
            />
          )}
          <GenericAutocomplete
            options={displaySpecialProperties}
            localFilters={localFilters}
            setLocalFilters={setLocalFilters}
            value={localFilters.specialProperties ?? []}
            filterKey={"specialProperties"}
            title={"מאפיינים מיוחדים"}
          />
          <Box>
            <Box minHeight="4.5rem" alignItems="center" marginX="10px">
              <Typography minWidth={"10rem"} fontSize="16px" sx={{ color: "#3256DF" }}>
                {"מקור הרשאה"}
              </Typography>
              <Paper variant="outlined" sx={{ height: 47 }}>
                <RadioGroup
                  row
                  value={localFilters?.authorizationSource || AuthorizationSource.ALL}
                  onChange={(_event, value) => setLocalFilters({ ...localFilters, authorizationSource: value })}
                  sx={{ gap: "60px", ml: 1 }}
                >
                  {Object.values(AuthorizationSource).map((authorizationSource) => (
                    <FormControlLabel
                      key={authorizationSource}
                      value={authorizationSource}
                      control={<Radio />}
                      label={<Typography fontSize="1rem">{authorizationSource}</Typography>}
                    ></FormControlLabel>
                  ))}
                </RadioGroup>
              </Paper>
            </Box>
          </Box>
          <Button onClick={clearAllFilters} sx={{ mx: "auto" }}>
            נקה את כל הסינונים
            <DeleteIcon />
          </Button>
        </Box>
      </Modal>
      {selectedDomain && (
        <AddClassificationsPopup
          open={!!selectedDomain}
          onClose={() => setSelectedDomain(null)}
          handleSave={(classifications) => {
            setLocalFilters({
              ...localFilters,
              domains: localFilters.domains?.map((domain) =>
                selectedDomain._id === domain._id ? { ...domain, selectedClassifications: classifications } : domain,
              ),
            });
          }}
          domainId={selectedDomain._id}
          initialSelectedClassifications={selectedDomain.selectedClassifications || []}
          domainsOptionsMap={domainsOptionsMap}
        />
      )}
    </>
  );
};

export default FilterUsersModal;
