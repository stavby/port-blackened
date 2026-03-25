import { Inject, Injectable, HttpException, HttpStatus } from "@nestjs/common";
import { Iterator, QueryData, QueryResult, Trino } from "trino-client";

@Injectable()
export class TrinoService {
  constructor(
    @Inject("TRINO")
    private readonly trino: Trino,
  ) {}

  async query<Row extends { [key: string]: any }>(query: string): Promise<Row[]> {
    if (!query) return [];

    const FAILED_STATE = "FAILED";
    let queryResultIterator: Iterator<QueryResult>;

    try {
      queryResultIterator = await this.trino.query(query);
    } catch {
      throw new HttpException("Couldn't connect to trino client", HttpStatus.INTERNAL_SERVER_ERROR);
    }

    const rows: Row[] = [];

    for await (const queryResult of queryResultIterator) {
      if (queryResult.stats?.state === FAILED_STATE) {
        throw queryResult.error;
      }

      if (!queryResult.columns) {
        throw new HttpException("Trino query did not return columns", HttpStatus.INTERNAL_SERVER_ERROR);
      }
      const columns = queryResult.columns;

      queryResult.data?.forEach((rowArray) =>
        rows.push(
          rowArray.reduce<Row>(
            (row, value, index): Row => ({
              ...row,
              [columns[index]!.name]: value,
            }),
            {} as Row,
          ),
        ),
      );
    }

    return rows;
  }

  async executePreparedStatement<Row extends { [key: string]: any } = { [key: string]: string }>(
    statement: string,
    statementName: string,
    ...statementArgs: (string | number)[]
  ) {
    const parsedArgs = statementArgs.map((arg) => (typeof arg === "string" ? `'${arg}'` : arg)).join(", ");
    await this.query(`PREPARE ${statementName} FROM ${statement}`);

    return await this.query<Row>(`EXECUTE ${statementName} USING ${parsedArgs}`);
  }

  // TODO: migrate to query
  async runQuery(query: string): Promise<QueryData[]> {
    let iter: Iterator<QueryResult>;
    try {
      iter = await this.trino.query(query);
    } catch (err) {
      throw `Trino connection error, ${err}`;
    }

    const data: QueryData[] = await iter
      .map((r) => {
        if (r.stats?.state == "FAILED") throw `Error in Trino query execute: ${r.error?.message}`;
        return r.data ?? [];
      })
      .fold<QueryData[]>([], (row, acc) => [...acc, ...row]);
    return data;
  }
}
