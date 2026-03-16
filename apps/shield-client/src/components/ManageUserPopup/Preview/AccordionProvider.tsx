import { StandardTable } from "@port/utils";
import { createContext, useCallback, useContext, useState } from "react";
import { z } from "zod";
import { BrowserApplication } from "./types";
import { ObjectIdBrand } from "@port/shield-schemas";

interface AccordionState {
  expandedMap: Record<AccordionId, boolean>;
  toggleAccordion: (id: AccordionId) => void;
}

const accordionIdSchema = z.string().brand<"AccordionId">();
type AccordionId = z.infer<typeof accordionIdSchema>;

type GenerateAccordionIdArg =
  | [domainId: ObjectIdBrand]
  | [domainId: ObjectIdBrand, application: BrowserApplication]
  | [domainId: ObjectIdBrand, application: BrowserApplication, table: StandardTable];

export const generateAccordionId = (arg: GenerateAccordionIdArg) => {
  const formattedArg = arg[2] ? [...arg.slice(0, arg.length - 1), arg[2].tableSchema, arg[2].tableName] : arg;
  return accordionIdSchema.parse(Object.values(formattedArg).join("-"));
};

const AccordionStateContext = createContext<AccordionState | null>(null);

export const AccordionProvider = ({ children }: { children: React.ReactNode }) => {
  const [expandedMap, setExpandedMap] = useState<Record<AccordionId, boolean>>({});

  const toggleAccordion = useCallback((id: AccordionId) => {
    setExpandedMap((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  }, []);

  return <AccordionStateContext.Provider value={{ expandedMap, toggleAccordion }}>{children}</AccordionStateContext.Provider>;
};

export const useAccordionState = () => {
  const context = useContext(AccordionStateContext);
  if (!context) {
    throw new Error("useAccordionState must be used within an AccordionProvider");
  }
  return context;
};
