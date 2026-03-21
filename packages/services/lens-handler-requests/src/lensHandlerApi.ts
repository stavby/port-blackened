import axios, { AxiosInstance, AxiosError } from "axios";
import {
  DatasetWithSchema,
  FormatDatasetReturn,
  GetLineage,
  GetSchema,
  OfferedDisplayName,
  OfferedDisplayNameForColumns,
} from "./lensHandlerApi.types.ts";
import { Agent } from "https";
import { SchemaColumn } from "./utils.ts";
import { readServerFile } from "@port/server-files";
import { formatAxiosError, StandardTable } from "@port/utils";
import { UserID } from "@port/common-schemas";

export class LensHandlerApi {
  private readonly lensHandler: AxiosInstance;
  constructor() {
    this.lensHandler = axios.create({
      baseURL: process.env.LENS_HANDLER_URL,
      // httpsAgent: new Agent({ rejectUnauthorized: true, ca: [readServerFile("")] }),
      // BLACKEND
      httpsAgent: new Agent({ rejectUnauthorized: false }),
    });

    this.lensHandler.interceptors.response.use(
      (res) => res,
      (error: AxiosError) => Promise.reject(formatAxiosError("LensService", error)),
    );
  }

  async getDatasets(): Promise<DatasetWithSchema[]> {
    return (await this.lensHandler.get("/api/catalog/datasets")).data;
  }

  async getDatasetsByTables(tables: StandardTable[]): Promise<DatasetWithSchema[]> {
    return (await this.lensHandler.post("/api/catalog/datasets", { tables })).data;
  }

  async getDatasetsByUser(userId: UserID): Promise<DatasetWithSchema[]> {
    return (await this.lensHandler.get(`/api/catalog/users/${userId}/datasets`)).data;
  }

  async getDatasetByUser(userId: UserID, table: StandardTable): Promise<DatasetWithSchema> {
    return (
      await this.lensHandler.get(
        `/api/catalog/users/${userId}/datasets/${encodeURIComponent(table.tableSchema)}/${encodeURIComponent(table.tableName)}`,
      )
    ).data;
  }

  async getDataset<T extends boolean>(table: StandardTable, { withSchema }: { withSchema: T }): Promise<FormatDatasetReturn<T>> {
    const dataset: DatasetWithSchema = (
      await this.lensHandler.get(`/api/catalog/datasets/${encodeURIComponent(table.tableSchema)}/${encodeURIComponent(table.tableName)}`)
    ).data;

    if (!withSchema) {
      const { schema, ...rest } = dataset;
      return rest as FormatDatasetReturn<T>;
    }

    return dataset;
  }

  async getDatasetLineage(table: StandardTable): Promise<GetLineage> {
    return (
      await this.lensHandler.get<GetLineage>(
        `/api/catalog/lineage/${encodeURIComponent(table.tableSchema)}/${encodeURIComponent(table.tableName)}`,
      )
    ).data;
  }

  async getDisplayNameRecommendation(columnName: string): Promise<OfferedDisplayName> {
    try {
      return (await this.lensHandler.get(`/api/catalog/schema/display-names/${encodeURIComponent(columnName)}`)).data;
    } catch (error) {
      console.error(error);
      return { displayName: "", isAccurate: true };
    }
  }

  async getDisplayNamesRecommendations(columnNames: string[]): Promise<OfferedDisplayNameForColumns> {
    return (await this.lensHandler.post("/api/catalog/schema/display-names", columnNames)).data;
  }

  async fillDisplayNames(schema: SchemaColumn[]): Promise<GetSchema> {
    const columnsToGet = schema.reduce((prev: string[], curr) => {
      return !curr.column_display_name?.length ? [...prev, curr.column_name] : prev;
    }, []);
    const displayNameRecommendations = await this.getDisplayNamesRecommendations(columnsToGet);

    return {
      schema: schema.map((og_col) => {
        const edited = { ...og_col };
        if (displayNameRecommendations[edited.column_name.toLowerCase()])
          edited.column_display_name = displayNameRecommendations[edited.column_name]!.displayName;
        return edited;
      }),
      alertColumns: Object.entries(displayNameRecommendations).reduce(
        (acc, [column, offeredDisplayName]) => (!offeredDisplayName.isAccurate ? [...acc, column] : acc),
        [] as string[],
      ),
    };
  }
}

const globalForLens = globalThis as unknown as {
  lens: LensHandlerApi | undefined;
};

export const lensHandlerApi = globalForLens.lens ?? new LensHandlerApi();

if (process.env.NODE_ENV !== "production") globalForLens.lens = lensHandlerApi;

export default lensHandlerApi;
