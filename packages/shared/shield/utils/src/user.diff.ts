import { calcDiff, calcSymetricDiff, DiffResult } from "./diff.utils.ts";

const userTypes = ["לקוח קצה", 'קפ"ט', "חוקר", "מערכת"] as const;
export type UserType = (typeof userTypes)[number];

type UserAttributes = {
  type: UserType;
  mask: boolean;
  unique_population: number[];
  deceased_population?: boolean;
};

const indications = ["mask", "deceased_population"] as const satisfies (keyof UserAttributes)[];

export type UserIndicationDiff = {
  kind: (typeof indications)[number];
  action_type: "ON" | "OFF";
};

type UserUniquePopulationDiff = {
  kind: "unique_population";
  type: "new" | "deleted";
  value: number;
};

type UserTypeDiff = {
  kind: "type";
  oldValue: UserAttributes["type"] | null;
  newValue: UserAttributes["type"] | null;
};

export type UserAttributesDiff = UserIndicationDiff | UserUniquePopulationDiff | UserTypeDiff;

const extractOnOffOption = (newValue: boolean | undefined, oldValue: boolean | undefined) => {
  if (oldValue === undefined) {
    return newValue ? "ON" : "OFF";
  }

  if (newValue === undefined) {
    return oldValue ? "OFF" : null;
  }

  if (newValue !== oldValue) {
    return newValue ? "ON" : "OFF";
  }

  return null;
};

type GetUserAttributesDiffArgs<T extends keyof UserAttributes = keyof UserAttributes> =
  | {
      currUserAttributes: Pick<UserAttributes, T>;
      newUserAttributes: Pick<UserAttributes, T>;
    }
  | {
      currUserAttributes: Pick<UserAttributes, T>;
      newUserAttributes?: Pick<UserAttributes, T>;
    }
  | {
      currUserAttributes?: Pick<UserAttributes, T>;
      newUserAttributes: Pick<UserAttributes, T>;
    };

export const getUserIndicationsDiff = ({
  newUserAttributes,
  currUserAttributes,
}: GetUserAttributesDiffArgs<"mask" | "deceased_population">): UserIndicationDiff[] => {
  const attributeDiffs: UserIndicationDiff[] = [];

  indications.forEach((indication) => {
    const onOffOption = extractOnOffOption(newUserAttributes?.[indication], currUserAttributes?.[indication]);

    if (onOffOption) {
      attributeDiffs.push({
        kind: indication,
        action_type: onOffOption,
      });
    }
  });

  return attributeDiffs;
};

export const getUserAttributesDiff = (args: GetUserAttributesDiffArgs): UserAttributesDiff[] => {
  const attributeDiffs: UserAttributesDiff[] = [];

  attributeDiffs.push(...getUserIndicationsDiff(args));

  if (!args.currUserAttributes || args.currUserAttributes.type !== args.newUserAttributes?.type) {
    attributeDiffs.push({
      kind: "type",
      oldValue: args.currUserAttributes?.type ?? null,
      newValue: args.newUserAttributes?.type ?? null,
    } satisfies UserTypeDiff);
  }

  const [deletedValues, newValues] = calcSymetricDiff(
    args.currUserAttributes?.unique_population ?? [],
    args.newUserAttributes?.unique_population ?? [],
  );

  deletedValues.forEach((value) => {
    attributeDiffs.push({ kind: "unique_population", type: "deleted", value });
  });

  newValues.forEach((value) => {
    attributeDiffs.push({ kind: "unique_population", type: "new", value });
  });

  return attributeDiffs;
};

export type BaseDomain<ID> = { id: ID; classifications: ID[] | { _id: ID }[] };

export type DomainDiff<ID, CurrDomain extends BaseDomain<ID>, NewDomain extends Pick<CurrDomain, keyof BaseDomain<ID>>> = DiffResult<
  NewDomain,
  CurrDomain,
  CurrDomain
>;

export type SplitedDomainDiff<ID, CurrDomain extends BaseDomain<ID>, NewDomain extends Pick<CurrDomain, keyof BaseDomain<ID>>> = DiffResult<
  NewDomain,
  {
    newClassifications: NewDomain["classifications"];
    deletedClassifications: CurrDomain["classifications"];
  } & Omit<CurrDomain, "classifications">,
  CurrDomain
>;

export type DomainDiffResult<
  ID,
  CurrDomain extends BaseDomain<ID>,
  NewDomain extends Pick<CurrDomain, keyof BaseDomain<ID>>,
  S extends boolean,
> = S extends true ? SplitedDomainDiff<ID, CurrDomain, NewDomain> : DomainDiff<ID, CurrDomain, NewDomain>;

export function getDomainsDiff<
  ID,
  CurrDomain extends BaseDomain<ID>,
  NewDomain extends Pick<CurrDomain, keyof BaseDomain<ID>>,
  S extends boolean,
>(
  currDomains: CurrDomain[],
  newDomains: NewDomain[],
  options: {
    splitClassifications: S;
    returnDeletedClassifications: boolean;
    idhashFunc: (id: ID) => string;
    classificationIdGetter: (classification: CurrDomain["classifications"][number] | NewDomain["classifications"][number]) => ID;
  },
): DomainDiffResult<ID, CurrDomain, NewDomain, S>[] {
  return calcDiff(
    currDomains,
    newDomains,
    (currDomain, newDomain) => options.idhashFunc(currDomain.id) === options.idhashFunc(newDomain.id),
    {
      updated: (currDomain, newDomain) => {
        const [newClassifications, deletedClassifications] = calcSymetricDiff<
          (typeof newDomain.classifications)[number],
          (typeof currDomain.classifications)[number]
        >(newDomain.classifications, currDomain.classifications, (classification) =>
          options.idhashFunc(options.classificationIdGetter(classification)),
        );

        if (newClassifications.length > 0 || deletedClassifications.length > 0) {
          if (!options.splitClassifications) {
            return {
              ...currDomain,
              classifications: [...newClassifications, ...deletedClassifications],
            };
          }

          const { classifications: _, ...rest } = currDomain;

          return {
            ...rest,
            newClassifications,
            deletedClassifications,
          };
        }

        return null;
      },
      deleted: (currDomain) => ({
        ...currDomain,
        classifications: options.returnDeletedClassifications ? currDomain.classifications : [],
      }),
    },
  ) as DomainDiffResult<ID, CurrDomain, NewDomain, S>[];
}

type RowFilterValue = { value: string | number; display_name: string };

type BasePermissionTable<ID> = {
  id: ID;
  row_filters: { kod: string; values: RowFilterValue[] }[];
};

type RowFilterDiff<ID, P extends BasePermissionTable<ID>> = {
  newValues: P["row_filters"][number]["values"];
  deletedValues: P["row_filters"][number]["values"];
};

type PermissionTableWithRowFilterDiff<ID, P extends BasePermissionTable<ID>> = Omit<P, "row_filters"> & {
  row_filters: (Omit<P["row_filters"][number], "values"> & RowFilterDiff<ID, P>)[];
};

export type PermissionTableDiff<
  ID,
  CurrPermissionTable extends BasePermissionTable<ID>,
  NewPermissionTable extends BasePermissionTable<ID>,
> = DiffResult<
  PermissionTableWithRowFilterDiff<ID, NewPermissionTable>,
  PermissionTableWithRowFilterDiff<ID, NewPermissionTable>,
  PermissionTableWithRowFilterDiff<ID, CurrPermissionTable>
>;

export const getPermissionTablesDiff = <
  ID,
  CurrPermissionTable extends BasePermissionTable<ID>,
  NewPermissionTable extends BasePermissionTable<ID>,
>(
  currPermissionTables: CurrPermissionTable[],
  newPermissionTables: NewPermissionTable[],
  idhashFunc: (id: ID) => string,
): PermissionTableDiff<ID, CurrPermissionTable, NewPermissionTable>[] => {
  return calcDiff(
    currPermissionTables,
    newPermissionTables,
    (currPermissionTable, newPermissionTable) => idhashFunc(currPermissionTable.id) === idhashFunc(newPermissionTable.id),
    {
      new: (newPermissionTable) => ({
        ...newPermissionTable,
        row_filters: newPermissionTable.row_filters.map((row_filter: NewPermissionTable["row_filters"][number]) => {
          const { values: _, ...rest } = row_filter;
          return {
            ...rest,
            newValues: row_filter.values,
            deletedValues: [],
          };
        }),
      }),
      updated: (currPermissionTable, newPermissionTable) => {
        const rowFiltersDiff = calcDiff<
          CurrPermissionTable["row_filters"][number],
          NewPermissionTable["row_filters"][number],
          Omit<NewPermissionTable["row_filters"][number], "values"> & RowFilterDiff<ID, NewPermissionTable>,
          Omit<NewPermissionTable["row_filters"][number], "values"> & RowFilterDiff<ID, NewPermissionTable>,
          unknown
        >(
          currPermissionTable.row_filters,
          newPermissionTable.row_filters,
          (currRowFilter, newRowFilter) => currRowFilter.kod === newRowFilter.kod,
          {
            new: (row_filter) => {
              const { values, ...rest } = row_filter;
              if (values.length > 0) {
                return {
                  ...rest,
                  newValues: row_filter.values,
                  deletedValues: [],
                };
              }
              return null;
            },
            updated: (currRowFilter, newRowFilter) => {
              const [newValues, deletedValues] = calcSymetricDiff(newRowFilter.values, currRowFilter.values, (value) =>
                value.value.toString(),
              );

              if (newValues.length > 0 || deletedValues.length > 0) {
                const { values: _, ...rest } = newRowFilter;
                return {
                  ...rest,
                  newValues: newValues,
                  deletedValues: deletedValues,
                };
              }
              return null;
            },
          },
        );

        const newOrUpdatedRowFilters = rowFiltersDiff.filter(
          (rowFilter) => rowFilter.diffType === "new" || rowFilter.diffType === "updated",
        );

        if (newOrUpdatedRowFilters.length > 0) {
          return {
            ...newPermissionTable,
            row_filters: newOrUpdatedRowFilters.map((rowFilter) => {
              const { diffType: _, ...rest } = rowFilter;

              return rest as typeof rowFilter;
            }),
          };
        }

        return null;
      },
      deleted: (currPermissionTable) => ({
        ...currPermissionTable,
        row_filters: currPermissionTable.row_filters.map((row_filter: CurrPermissionTable["row_filters"][number]) => {
          const { values: _, ...rest } = row_filter;
          return {
            ...rest,
            newValues: [],
            deletedValues: row_filter.values,
          };
        }),
      }),
    },
  );
};
