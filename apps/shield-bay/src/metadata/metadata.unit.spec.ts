import { TABLES, ZOD_SCHEMAS_BY_TABLE } from "../common/constants";
import { zodToTableSchemaDef } from "./metadata.utils";

describe("zodToTableSchemaDef", () => {
  describe.each(TABLES.options)("Testing zodToTableSchemaDef", (table) => {
    it(`zodToTableSchemaDef should not throw error for ${table}`, async () => {
      const result = zodToTableSchemaDef(ZOD_SCHEMAS_BY_TABLE[table]);
      expect(result).toBeDefined();
    });
  });
});
