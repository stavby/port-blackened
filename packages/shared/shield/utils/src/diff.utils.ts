export const calcSymetricDiff = <T, S>(a: T[], b: S[], hash: (item: T | S) => string = String): [T[], S[]] => {
  const setA = new Set(a.map(hash));
  const setB = new Set(b.map(hash));

  return [a.filter((element) => !setB.has(hash(element))), b.filter((element) => !setA.has(hash(element)))];
};

export type DiffResult<TNewMeta, TUpdatedMeta, TDeletedMeta> =
  | ({ diffType: "new" } & TNewMeta)
  | ({ diffType: "updated" } & TUpdatedMeta)
  | ({ diffType: "deleted" } & TDeletedMeta);

export type DiffType = DiffResult<unknown, unknown, unknown>["diffType"];

export const calcDiff = <TCurrent, TNew, TNewMeta, TUpdatedMeta, TDeletedMeta>(
  currItems: TCurrent[],
  newItems: TNew[],
  compareFn: (curreItem: TCurrent, newItem: TNew) => boolean,
  metaGetters: {
    new?: (newItem: TNew) => TNewMeta | null;
    updated: (currItem: TCurrent, newItem: TNew) => TUpdatedMeta | null;
    deleted?: (currItem: TCurrent) => TDeletedMeta | null;
  },
): DiffResult<TNewMeta, TUpdatedMeta, TDeletedMeta>[] => {
  const diffs: DiffResult<TNewMeta, TUpdatedMeta, TDeletedMeta>[] = [];
  const remainingCurrItems = [...currItems];

  newItems.forEach((newItem) => {
    const matchingIndex = remainingCurrItems.findIndex((currItem) => compareFn(currItem, newItem));

    if (matchingIndex === -1) {
      const meta = metaGetters.new ? metaGetters.new(newItem) : newItem;
      if (meta) {
        diffs.push({ ...meta, diffType: "new" });
      }
    } else {
      const currItem = remainingCurrItems[matchingIndex]!;
      const meta = metaGetters.updated(currItem, newItem);
      if (meta) {
        diffs.push({ ...meta, diffType: "updated" });
      }
      remainingCurrItems.splice(matchingIndex, 1);
    }
  });

  remainingCurrItems.forEach((deletedItem) => {
    const meta = metaGetters.deleted ? metaGetters.deleted(deletedItem) : deletedItem;
    if (meta) {
      diffs.push({ ...meta, diffType: "deleted" });
    }
  });

  return diffs;
};

export type DiffByType<Diff extends DiffResult<unknown, unknown, unknown>> = {
  [diffType in DiffType]: Omit<Extract<Diff, { diffType: diffType }>, "diffType">[];
};

export const toDiffByType = <D extends DiffResult<unknown, unknown, unknown>>(diff: D[]) => {
  return diff.reduce<DiffByType<D>>(
    (acc, diff) => {
      const { diffType, ...meta } = diff;

      return {
        ...acc,
        [diffType]: [...acc[diffType], meta],
      };
    },
    { new: [], updated: [], deleted: [] },
  );
};

export const getDiffByType = <TCurrent, TNew, TNewMeta, TUpdatedMeta, TDeletedMeta>(
  ...args: Parameters<typeof calcDiff<TCurrent, TNew, TNewMeta, TUpdatedMeta, TDeletedMeta>>
): DiffByType<DiffResult<TNewMeta, TUpdatedMeta, TDeletedMeta>> => {
  const diff = calcDiff(...args);
  return toDiffByType(diff);
};
