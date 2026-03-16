import { useGetLiveTablesByUser } from "@api/users";
import { ArrowLeftSharp } from "@mui/icons-material";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  CircularProgress,
  Divider,
  Stack,
  SxProps,
  Typography,
  accordionSummaryClasses,
} from "@mui/material";
import { MergedClientUser } from "@types";
import { CountChipStyled } from "../UserDomains/UserDomains.style";
import ApplicationAccordion from "./ApplicationAccordion";
import { BrowserApplication, GetUserPreviewWithId } from "./types";
import { generateAccordionId, useAccordionState } from "./AccordionProvider";
import { INITIAL_EMPTY_USER } from "../UserInfo/constants";
import { useMemo } from "react";
import { Dataset, UserID } from "@port/common-schemas";
import { ObjectIdBrand, TablePreviewDto } from "@port/shield-schemas";
import { getObjectKeys, SafeExtract } from "@port/utils";

type PreviewPropsCommon = {
  addionalSx?: SxProps;
};

export type PreviewProps = (
  | {
      user: MergedClientUser;
      type: SafeExtract<GetUserPreviewWithId["type"], "new" | "compare">;
    }
  | {
      userId: UserID;
      type: SafeExtract<GetUserPreviewWithId["type"], "current">;
    }
) &
  PreviewPropsCommon;

type GroupedDataSets<T extends TablePreviewDto> = {
  [domain: ObjectIdBrand]: { [key in BrowserApplication]: T[] };
};

const getBrowserApplication = (application: Dataset["application"]): BrowserApplication =>
  application === "remix" ? "remix" : "source_table";

const groupDataSets = (datasets: TablePreviewDto[]): GroupedDataSets<TablePreviewDto> => {
  const grouped = datasets.reduce<GroupedDataSets<TablePreviewDto>>((acc, dataset) => {
    const domain = dataset.attributes.domain_id;
    acc[domain] = acc[domain] ?? { remix: [], source_table: [] };
    acc[domain]![getBrowserApplication(dataset.application)].push(dataset);

    return acc;
  }, {});

  return grouped;
};

const Preview = (props: PreviewProps) => {
  const { addionalSx, ...propsWithoutSx } = props;
  const previewUser = useMemo<GetUserPreviewWithId>(
    () => ({
      userId: propsWithoutSx.type === "current" ? propsWithoutSx.userId : propsWithoutSx.user.user_id,
      data:
        propsWithoutSx.type === "current"
          ? undefined
          : {
              domains: propsWithoutSx.user.domains.map((domain) => ({
                id: domain.id,
                classifications: domain.classifications.map(({ _id }) => _id),
              })),
              is_read_all: propsWithoutSx.user.is_read_all ?? false,
            },
      type: propsWithoutSx.type,
    }),
    [propsWithoutSx],
  );
  const { data, isSuccess, isLoading, isError } = useGetLiveTablesByUser(previewUser.userId, previewUser, {
    enabled: previewUser.userId !== INITIAL_EMPTY_USER.user_id,
  });
  const groupDataSetsx = groupDataSets(data ?? []);
  const { expandedMap, toggleAccordion } = useAccordionState();

  return (
    <Box p={2}>
      <Stack direction={"row"} spacing={1} sx={{ paddingBottom: 1.5, alignItems: "center" }}>
        <CountChipStyled label={Object.keys(groupDataSetsx).length} />
        <Typography sx={{ fontWeight: "bold" }}>עולמות תוכן </Typography>
      </Stack>
      <Divider variant="middle" />
      <Box display={"flex"} justifyContent={"center"} alignContent={"center"}>
        <Box width={"95%"}>
          {isError && (
            <Box width={"100%"} height={"100%"} display={"flex"} justifyContent={"center"} alignItems={"center"} mt={20}>
              <Alert severity="error" sx={{ fontWeight: "bold" }}>
                הייתה שגיאה בהשגת התצוגה המקדימה
              </Alert>
            </Box>
          )}
          {isLoading && (
            <Box width={"100%"} height={"100%"} display={"flex"} justifyContent={"center"} alignItems={"center"} mt={20}>
              <CircularProgress size={100} />
            </Box>
          )}
          {isSuccess &&
            getObjectKeys(groupDataSetsx).map((domain) => {
              const accordionId = generateAccordionId([domain]);
              const isExpanded = !!expandedMap[accordionId];

              return (
                <Accordion
                  key={domain}
                  className="domain-accordion"
                  variant="outlined"
                  sx={{
                    direction: "rtl",
                    border: 0,
                    boxShadow: "none",
                    ...addionalSx,
                  }}
                  disableGutters
                  expanded={isExpanded}
                  onChange={() => toggleAccordion(accordionId)}
                >
                  <AccordionSummary
                    sx={{
                      fontSize: 18,
                      minHeight: "45px",
                      maxHeight: "45px",
                      [`& .${accordionSummaryClasses.content}`]: {
                        justifyContent: "flex-end",
                        mr: 1,
                      },
                      [`& .${accordionSummaryClasses.expanded}`]: {
                        fontWeight: 500,
                      },
                      [`& .${accordionSummaryClasses.expandIconWrapper}.${accordionSummaryClasses.expanded}`]: {
                        transform: "rotate(-90deg)",
                      },
                    }}
                    expandIcon={<ArrowLeftSharp />}
                  >
                    {groupDataSetsx[domain]?.source_table[0]?.attributes.display_name ??
                      groupDataSetsx[domain]?.remix[0]?.attributes.display_name ??
                      domain}
                  </AccordionSummary>

                  <AccordionDetails sx={{ p: 0 }}>
                    {(groupDataSetsx?.[domain]?.source_table ?? []).length > 0 && (
                      <ApplicationAccordion
                        browserApplication="source_table"
                        domain_id={domain}
                        tables={groupDataSetsx?.[domain]?.source_table ?? []}
                        addionalSx={addionalSx}
                        userAttributes={previewUser}
                      />
                    )}
                    {(groupDataSetsx?.[domain]?.remix ?? []).length > 0 && (
                      <ApplicationAccordion
                        addionalSx={addionalSx}
                        browserApplication="remix"
                        domain_id={domain}
                        tables={groupDataSetsx?.[domain]?.remix ?? []}
                        userAttributes={previewUser}
                      />
                    )}
                  </AccordionDetails>
                </Accordion>
              );
            })}
        </Box>
      </Box>
    </Box>
  );
};

export default Preview;
