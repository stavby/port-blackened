"use client";

import { useState } from "react";

const useExpandableSchemas = (schemasCount: number) => {
  const [schemasAreExpanded, setSchemasAreExpanded] = useState(new Array(schemasCount).fill(false));
  const handleSchemaAccordionChange = (index: number) => {
    setSchemasAreExpanded((prev) => {
      const newState = [...prev];
      newState[index] = !newState[index];
      return newState;
    });
  };

  return { schemasAreExpanded, handleSchemaAccordionChange };
};

export { useExpandableSchemas };
