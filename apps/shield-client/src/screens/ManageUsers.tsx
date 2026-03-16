import { useDomainsManage } from "@api/domains";
import { getUsers, getUsersExcel } from "@api/users";
import { CardUser, CardUserHeaderChipGroups, CardUserSkeleton, ManageUserPopUp, ScreenTitle, SearchField } from "@components";
import FilterUsersModal from "@components/FilterUsers/FilterUsersModal";
import { CustomPagination } from "@components/Pagination/CustomPagination";
import { StickyPageHeader } from "@components/StickyPageHeader";
import { useLoadingContext } from "@contexts/Loading";
import { updateUserInCache } from "@helpers/users";
import { AddCircle, AddCircleOutlined } from "@mui/icons-material";
import FilterOutlinedIcon from "@mui/icons-material/FilterAltOutlined";
import { Avatar, Box, Button, Chip, Grid, Typography } from "@mui/material";
import { UsersThree } from "@phosphor-icons/react";
import { StyledTooltip } from "@port/components/styledTooltip";
import { AuthorizationSource, GetUsersResponseDto, USERS_PER_PAGE } from "@port/shield-schemas";
import { getObjectEntries } from "@port/utils";
import { useSnackBarStore } from "@store/snackbarStore";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FilterUsersInput } from "@types";
import { saveAs } from "file-saver";
import { useEffect, useMemo, useRef, useState } from "react";

const FilterSign = ({
  label,
  content,
  filterKey,
  filters,
  setFilters,
}: {
  label: string;
  content: { id: string; display: string }[];
  filterKey: keyof FilterUsersInput;
  filters: FilterUsersInput;
  setFilters: (filters: FilterUsersInput) => void;
}) => {
  return (
    <StyledTooltip
      disableMaxWidth
      title={
        filters[filterKey] &&
        Array.isArray(filters[filterKey]) && (
          <Box
            display="flex"
            justifyContent="center"
            py={1}
            gap={1}
            flexWrap="wrap"
            maxWidth="25vw"
            bgcolor="inherit"
            borderRadius="inherit"
          >
            {content.map((item) => {
              return (
                <CardUserHeaderChipGroups
                  sx={{ bgcolor: "white" }}
                  variant="outlined"
                  key={item.id}
                  label={
                    <Box display="flex" bgcolor="white" alignItems="center" gap={1}>
                      {item.display}
                    </Box>
                  }
                />
              );
            })}
          </Box>
        )
      }
    >
      <Chip
        dir="ltr"
        variant="outlined"
        label={label}
        avatar={content.length > 0 ? <Avatar sx={{ bgcolor: "#3256df", color: "white" }}>{content.length}</Avatar> : undefined}
        sx={{
          "& .MuiChip-avatar": { color: "white", ml: 0, mr: "4px" },
          "& .MuiChip-deleteIcon": { ml: "4px", mr: 0 },
        }}
        onDelete={() => {
          setFilters(Object.fromEntries(Object.entries(filters).filter(([currFilterKey, _]) => currFilterKey !== filterKey)));
        }}
      />
    </StyledTooltip>
  );
};

function ManageUsers() {
  const [isFilterModalOpen, setIsFilterModalOpen] = useState<boolean>(false);
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [openAddUser, setOpenAddUser] = useState<boolean>(false);
  const { data: domainsOptions } = useDomainsManage();
  const setSnackbarError = useSnackBarStore((state) => state.setSnackbarError);
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<FilterUsersInput>({});
  const { setLoading } = useLoadingContext();

  const {
    data: usersData,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["paginatedUsers", { search: searchTerm, page }, filters],
    queryFn: () => getUsers(page, searchTerm, filters),
    staleTime: 10000,
    retry: 1,
    meta: { loading: false },
  });

  const lastDataRef = useRef(usersData);
  useEffect(() => {
    if (usersData) {
      lastDataRef.current = usersData;
    }
  }, [usersData]);

  const users = usersData?.users ?? [];
  const getPageAmount = (usersCount: number) => Math.ceil(usersCount / USERS_PER_PAGE);

  const pageCount = useMemo(() => {
    if (!usersData?.metadata) return lastDataRef.current?.metadata[0] ? getPageAmount(lastDataRef.current.metadata[0].totalCount) : 0;
    return getPageAmount(usersData.metadata[0]?.totalCount || 0);
  }, [usersData]);

  const domainsOptionsMap = useMemo(
    () => new Map(domainsOptions?.map((domainOption) => [domainOption._id, domainOption])),
    [domainsOptions],
  );

  useEffect(() => {
    if (error) {
      console.error("Error in fetching users", error);
    }
  }, [error]);

  useEffect(() => {
    if (usersData && pageCount > page) {
      queryClient.prefetchQuery({
        queryKey: ["paginatedUsers", { search: searchTerm, page: page + 1 }, filters],
        queryFn: () => getUsers(page + 1, searchTerm, filters),
        meta: { loading: false },
      });
    }
  }, [usersData, page, pageCount, queryClient, searchTerm, filters]);

  const exportToExcel = async () => {
    try {
      const usersExcelFile = await getUsersExcel(searchTerm, filters);
      setLoading(true);

      saveAs(usersExcelFile, `ניהול_משתמשים.xlsb`);
    } catch {
      setSnackbarError("שגיאה בעת טעינת אקסל");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box display="flex" flexDirection={"column"}>
      {isFilterModalOpen && (
        <FilterUsersModal
          filters={filters}
          setFilters={setFilters}
          isFilterModalOpen={isFilterModalOpen}
          onClose={() => {
            setIsFilterModalOpen(false);
          }}
        />
      )}
      {openAddUser && (
        <ManageUserPopUp
          openModal={openAddUser}
          setOpenModal={setOpenAddUser}
          handleChangeEditedUser={(user, isNewUser) => {
            if (isNewUser) {
              queryClient.setQueryData(["paginatedUsers", { search: "", page: 1 }, {}], (oldData: GetUsersResponseDto) => {
                if (!oldData) return oldData;
                return {
                  ...oldData,
                  users: [user, ...oldData.users.slice(0, oldData.users.length === USERS_PER_PAGE ? oldData.users.length - 1 : undefined)],
                };
              });
            } else {
              updateUserInCache(queryClient, user);
            }

            queryClient.invalidateQueries({ queryKey: ["paginatedUsers"] });
            setSearchTerm("");
            setPage(1);
            setFilters({});
          }}
          domainsOptions={domainsOptions ?? []}
          domainsOptionsMap={domainsOptionsMap}
        />
      )}
      <StickyPageHeader>
        <ScreenTitle screenName="ניהול משתמשים" screenIcon={<UsersThree fontSize={25} weight="thin" style={{ marginLeft: 5 }} />} />
        <Grid container justifyContent="space-between" columnSpacing={1}>
          <Grid item xs={1.9} textAlign="left">
            <SearchField overrideSearchTerm={searchTerm} handleSearch={setSearchTerm} />
          </Grid>
          <Grid item xs={8} textAlign="left" display={"flex"} gap={"15px"} alignItems={"center"}>
            <Button onClick={() => setIsFilterModalOpen(true)}>
              <FilterOutlinedIcon />
              <Typography color="black">הוסף סינון</Typography>
            </Button>
            {getObjectEntries(filters)
              .filter(([filterKey, filterValue]) =>
                filterKey === "authorizationSource" ? filterValue !== AuthorizationSource.ALL : !!filters[filterKey]?.length,
              )
              .map(([filterKey, filterValue]) => {
                let content: { id: string; display: string }[] = [];

                let label = "";
                // const content = Array.isArray(filterValue) ? filterValue : undefined;
                switch (filterKey) {
                  case "domains":
                    content = filters[filterKey]?.map((domain) => ({ id: domain._id, display: domain.display_name })) ?? [];
                    label = "עולמות תוכן";
                    break;
                  case "permissionGroups":
                    content =
                      filters[filterKey]?.map((permissionGroup) => ({ id: permissionGroup._id, display: permissionGroup.name })) ?? [];
                    label = "קבוצות הרשאות";
                    break;
                  case "specialProperties":
                    content = filters[filterKey]?.map((specialProperty) => ({ id: specialProperty, display: specialProperty })) ?? [];
                    label = "מאפיינים מיוחדים";
                    break;
                  case "userTypes":
                    content = filters[filterKey]?.map((userType) => ({ id: userType, display: userType })) ?? [];

                    label = "סוגי משתמשים";
                    break;
                  case "authorizationSource":
                    label = filterValue + "-הרשאות מ";
                    break;
                  default:
                    throw new Error(`Unknown filterKey ${filterKey satisfies never}`);
                }
                return (
                  <FilterSign
                    key={filterKey}
                    label={label}
                    content={content}
                    filterKey={filterKey}
                    filters={filters}
                    setFilters={setFilters}
                  />
                );
              })}
          </Grid>
          <Grid item xs={1.1} textAlign="right">
            <Button
              variant="outlined"
              onClick={() => {
                setOpenAddUser(true);
              }}
              fullWidth
              startIcon={<AddCircleOutlined style={{ color: "#3256df" }} />}
              sx={{ color: "#475467" }}
            >
              הוספת הרשאה
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
      {isLoading && (
        <div>
          <CardUserSkeleton />
          <CardUserSkeleton />
          <CardUserSkeleton />
        </div>
      )}
      {isError && <p>שגיאה בעת טעינת המשתמשים</p>}
      {!isLoading &&
        users.map((user) => (
          <CardUser userDto={user} key={user._id} domainsOptions={domainsOptions ?? []} domainsOptionsMap={domainsOptionsMap} />
        ))}
      {!!pageCount && (
        <Box display="flex" justifyContent="center" width="100%" pt={1}>
          <CustomPagination count={pageCount} page={page} handlePageChange={(newPage) => setPage(newPage)} />
        </Box>
      )}
    </Box>
  );
}

export default ManageUsers;
