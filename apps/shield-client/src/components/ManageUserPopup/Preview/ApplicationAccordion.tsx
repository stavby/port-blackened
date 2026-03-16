"use client";

import { ArrowLeftSharp } from "@mui/icons-material";
import { Accordion, AccordionDetails, AccordionSummary, SxProps, Tooltip, Typography, accordionSummaryClasses } from "@mui/material";
import { formatRawStandardTable } from "@port/utils";
import DatasetSchema from "./DatasetSchema";
import { BrowserApplication, GetUserPreviewWithId } from "./types";
import { generateAccordionId, useAccordionState } from "./AccordionProvider";
import { ObjectIdBrand, TablePreviewDto } from "@port/shield-schemas";

interface BrowserApplicationAccordionProps {
  browserApplication: BrowserApplication;
  tables: TablePreviewDto[];
  userAttributes: GetUserPreviewWithId;
  domain_id: ObjectIdBrand;
  addionalSx?: SxProps;
}

const tootlipLabels = {
  source_table: "טבלאות מקור",
  remix: "Remixפריסות מידע שנוצרו ב",
} satisfies Record<BrowserApplication, string>;

const labels = {
  source_table: "טבלאות מקור",
  remix: "מיקסים",
} satisfies Record<BrowserApplication, string>;

const ApplicationAccordion = ({ tables, browserApplication, domain_id, addionalSx, userAttributes }: BrowserApplicationAccordionProps) => {
  const { expandedMap, toggleAccordion } = useAccordionState();
  const accordionId = generateAccordionId([domain_id, browserApplication]);
  const isExpanded = !!expandedMap[accordionId];

  return (
    <Accordion
      sx={{ boxShadow: "none", ...addionalSx }}
      className={`application-accordion-${browserApplication}`}
      disableGutters
      slotProps={{ transition: { unmountOnExit: true } }}
      expanded={isExpanded}
      onChange={() => toggleAccordion(accordionId)}
    >
      <AccordionSummary
        sx={{
          ml: 3,
          [`& .${accordionSummaryClasses.content}`]: {
            justifyContent: "flex-end",
            my: 0,
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
        <Tooltip title={tootlipLabels[browserApplication]} slotProps={{ tooltip: { sx: { fontSize: 14 } } }} placement="left">
          <Typography fontWeight="inherit" color={"blue"} sx={{ direction: "rtl" }} height="100%" textAlign="center">
            {labels[browserApplication]}
          </Typography>
        </Tooltip>
      </AccordionSummary>
      <AccordionDetails sx={{ p: 0 }}>
        {tables.map((table) => (
          <DatasetSchema
            addionalSx={addionalSx}
            table={table}
            expandData={{ domain_id, browserApplication }}
            key={formatRawStandardTable({ tableSchema: table.schema_name, tableName: table.table_name })}
            userAttributes={userAttributes}
          />
        ))}
      </AccordionDetails>
    </Accordion>
  );
};

export default ApplicationAccordion;
