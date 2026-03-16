import { ObjectId } from "mongodb";
import { getColumnsDictDiff } from "./table.utils";
import { EditableColumnsDict } from "./table.classes";
import { ColumnDictDiff } from "@port/shield-models";

describe("getColumnsDictDiff", () => {
  const classifications = [new ObjectId(), new ObjectId(), new ObjectId()];

  test.each<{
    desc: string;
    columnsDict: EditableColumnsDict;
    newColumnsDict: EditableColumnsDict;
    expected: ColumnDictDiff[];
  }>([
    { desc: "should return an empty array when both dictionaries are empty", columnsDict: {}, newColumnsDict: {}, expected: [] },
    {
      desc: "should detect no changes when columns are identical",
      columnsDict: {
        column1: {
          column_name: "column1",
          attributes: {
            classification: classifications[0],
            mask: "none",
          },
        },
      },
      newColumnsDict: {
        column1: {
          column_name: "column1",
          attributes: {
            classification: classifications[0],
            mask: "none",
          },
        },
      },
      expected: [],
    },
    {
      desc: "should detect updates in classification",
      columnsDict: {
        column1: {
          column_name: "column1",
          attributes: {
            classification: classifications[0],
            mask: "null",
          },
        },
      },
      newColumnsDict: {
        column1: {
          column_name: "column1",
          attributes: {
            classification: classifications[1],
            mask: "null",
          },
        },
      },
      expected: [
        {
          column_name: "column1",
          kind: "classification",
          oldValue: classifications[0],
          newValue: classifications[1],
        },
      ],
    },
    {
      desc: "should detect updates in mask",
      columnsDict: {
        column1: {
          column_name: "column1",
          attributes: {
            classification: classifications[0],
            mask: "hash",
          },
        },
      },
      newColumnsDict: {
        column1: {
          column_name: "column1",
          attributes: {
            classification: classifications[0],
            mask: "null",
          },
        },
      },
      expected: [
        {
          column_name: "column1",
          kind: "mask",
          newValue: "null",
          oldValue: "hash",
        },
      ],
    },
    {
      desc: "should handle undefined classification",
      columnsDict: {
        column1: {
          column_name: "column1",
          attributes: {
            mask: "null",
          },
        },
        column2: {
          column_name: "column2",
          attributes: {
            classification: classifications[0],
            mask: "hash",
          },
        },
      },
      newColumnsDict: {
        column1: {
          column_name: "column1",
          attributes: {
            classification: classifications[0],
            mask: "null",
          },
        },
        column2: {
          column_name: "column2",
          attributes: {
            mask: "hash",
          },
        },
      },
      expected: [
        {
          column_name: "column1",
          kind: "classification",
          newValue: classifications[0],
          oldValue: null,
        },
        {
          column_name: "column2",
          kind: "classification",
          oldValue: classifications[0],
          newValue: null,
        },
      ],
    },
    {
      desc: "should handle partial updates and new column",
      columnsDict: {
        column1: {
          column_name: "column1",
          attributes: {
            classification: classifications[1],
            mask: "null",
          },
        },
        column2: {
          column_name: "column2",
          attributes: {
            classification: classifications[0],
            mask: "hash",
          },
        },
      },
      newColumnsDict: {
        column1: {
          column_name: "column1",
          attributes: {
            classification: classifications[0],
            mask: "null",
          },
        },
        column3: {
          column_name: "column3",
          attributes: {
            classification: classifications[0],
            mask: "hash",
          },
        },
      },
      expected: [
        {
          column_name: "column1",
          kind: "classification",
          newValue: classifications[0],
          oldValue: classifications[1],
        },
        {
          column_name: "column3",
          kind: "classification",
          oldValue: null,
          newValue: classifications[0],
        },
        {
          column_name: "column3",
          kind: "mask",
          oldValue: null,
          newValue: "hash",
        },
      ],
    },
  ])("$desc", ({ columnsDict, newColumnsDict, expected }) => {
    expect(getColumnsDictDiff(columnsDict, newColumnsDict)).toEqual(expected);
  });
});
