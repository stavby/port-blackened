import { ObjectId } from "mongodb";
import { UserDomain, UserPermissionTable, UserRowFilter } from "./user.classes";
import { SplitedDomainDiffServer, DomainDiffServer, PermissionTableDiffServer, CreateUserDtoDomain } from "./user.interfaces";
import { getDomainsDiffServer, getPermissionTablesDiffServer } from "./user.utils";
import { SplitedDomainDiff } from "@port/shield-utils";
import { UserID } from "@port/common-schemas";

const sortDomains = (domains: SplitedDomainDiffServer[] | DomainDiffServer[]) => {
  domains.sort();
  domains.forEach((domain: SplitedDomainDiffServer | DomainDiffServer) => {
    if (domain.diffType === "updated") {
      if ("newClassifications" in domain) {
        domain.deletedClassifications.sort();
        domain.newClassifications.sort();
      } else {
        domain.classifications.sort();
      }
    } else {
      domain.classifications.sort();
    }
  });
};

const sortPermissionTables = (permissionTables: PermissionTableDiffServer[]) => {
  permissionTables.sort();
  permissionTables.forEach((domain) => {
    domain.row_filters.sort();
    domain.row_filters.forEach((row_filter) => {
      row_filter.newValues.sort();
      row_filter.deletedValues.sort();
    });
  });
};

describe("getDomainDiff", () => {
  const domainIds = [new ObjectId(), new ObjectId(), new ObjectId()];
  const classificationIds = [new ObjectId(), new ObjectId(), new ObjectId(), new ObjectId(), new ObjectId(), new ObjectId()];
  const last_changed_by: UserDomain["last_changed_by"] = "fake_user_id" as UserID;

  test.each<{
    desc: string;
    currDomains: Pick<UserDomain, "classifications" | "id" | "last_changed_by">[];
    newDomains: CreateUserDtoDomain[];
    splitAndReturnDeletedExpected: SplitedDomainDiff<
      ObjectId,
      Pick<UserDomain, "classifications" | "id" | "last_changed_by">,
      CreateUserDtoDomain
    >[];
    expected: DomainDiffServer[];
  }>([
    {
      desc: "should return domains only in newDomains with their classifications",
      currDomains: [],
      newDomains: [{ id: domainIds[0], classifications: [classificationIds[0], classificationIds[1]] }],
      expected: [{ id: domainIds[0], classifications: [classificationIds[0], classificationIds[1]], diffType: "new" }],
      splitAndReturnDeletedExpected: [{ id: domainIds[0], classifications: [classificationIds[0], classificationIds[1]], diffType: "new" }],
    },
    {
      desc: "should return domain with classifications only in one version",
      currDomains: [{ id: domainIds[0], classifications: [classificationIds[0]], last_changed_by }],
      newDomains: [{ id: domainIds[0], classifications: [classificationIds[0], classificationIds[1]] }],
      expected: [{ id: domainIds[0], classifications: [classificationIds[1]], diffType: "updated", last_changed_by }],
      splitAndReturnDeletedExpected: [
        { id: domainIds[0], deletedClassifications: [], newClassifications: [classificationIds[1]], diffType: "updated", last_changed_by },
      ],
    },
    {
      desc: "should return domain deleted if it only exists in currDomains",
      currDomains: [{ id: domainIds[0], classifications: [classificationIds[0]], last_changed_by }],
      newDomains: [],
      expected: [{ id: domainIds[0], classifications: [], diffType: "deleted", last_changed_by }],
      splitAndReturnDeletedExpected: [{ id: domainIds[0], classifications: [classificationIds[0]], diffType: "deleted", last_changed_by }],
    },
    {
      desc: "should return empty array if currDomains and newDomains are identical",
      currDomains: [{ id: domainIds[0], classifications: [classificationIds[0], classificationIds[1]], last_changed_by }],
      newDomains: [{ id: domainIds[0], classifications: [classificationIds[0], classificationIds[1]] }],
      expected: [],
      splitAndReturnDeletedExpected: [],
    },
    {
      desc: "should handle complex differences correctly",
      currDomains: [
        { id: domainIds[0], classifications: [classificationIds[0]], last_changed_by },
        { id: domainIds[1], classifications: [classificationIds[2]] },
      ],
      newDomains: [
        { id: domainIds[0], classifications: [classificationIds[0], classificationIds[1]] },
        { id: domainIds[2], classifications: [classificationIds[3]] },
      ],
      expected: [
        { id: domainIds[0], classifications: [classificationIds[1]], diffType: "updated", last_changed_by },
        { id: domainIds[2], classifications: [classificationIds[3]], diffType: "new" },
        { id: domainIds[1], classifications: [], diffType: "deleted" },
      ],
      splitAndReturnDeletedExpected: [
        { id: domainIds[0], newClassifications: [classificationIds[1]], deletedClassifications: [], diffType: "updated", last_changed_by },
        { id: domainIds[2], classifications: [classificationIds[3]], diffType: "new" },
        { id: domainIds[1], classifications: [classificationIds[2]], diffType: "deleted" },
      ],
    },
    {
      desc: "should handle domains with empty classifications arrays",
      currDomains: [{ id: domainIds[0], classifications: [], last_changed_by }],
      newDomains: [{ id: domainIds[0], classifications: [classificationIds[0], classificationIds[1]] }],
      expected: [
        {
          id: domainIds[0],
          classifications: [classificationIds[0], classificationIds[1]],
          diffType: "updated",
          last_changed_by,
        },
      ],
      splitAndReturnDeletedExpected: [
        {
          id: domainIds[0],
          newClassifications: [classificationIds[0], classificationIds[1]],
          deletedClassifications: [],
          diffType: "updated",
          last_changed_by,
        },
      ],
    },

    {
      desc: "should correctly process multiple domains with overlapping classifications",
      currDomains: [
        { id: domainIds[0], classifications: [classificationIds[0], classificationIds[1]], last_changed_by },
        { id: domainIds[1], classifications: [classificationIds[2], classificationIds[3]], last_changed_by },
      ],
      newDomains: [
        { id: domainIds[0], classifications: [classificationIds[0], classificationIds[4]] },
        { id: domainIds[1], classifications: [classificationIds[3], classificationIds[5]] },
      ],
      expected: [
        {
          id: domainIds[0],
          classifications: [classificationIds[1], classificationIds[4]],
          diffType: "updated",
          last_changed_by,
        },
        {
          id: domainIds[1],
          classifications: [classificationIds[2], classificationIds[5]],
          diffType: "updated",
          last_changed_by,
        },
      ],
      splitAndReturnDeletedExpected: [
        {
          id: domainIds[0],
          newClassifications: [classificationIds[4]],
          deletedClassifications: [classificationIds[1]],
          diffType: "updated",
          last_changed_by,
        },
        {
          id: domainIds[1],
          deletedClassifications: [classificationIds[2]],
          newClassifications: [classificationIds[5]],
          diffType: "updated",
          last_changed_by,
        },
      ],
    },
    {
      desc: "should return empty array when both currDomains and newDomains are empty",
      currDomains: [],
      newDomains: [],
      expected: [],
      splitAndReturnDeletedExpected: [],
    },
    {
      desc: "should handle domains with no classifications correctly (both in curr and new)",
      currDomains: [{ id: domainIds[0], classifications: [] }],
      newDomains: [{ id: domainIds[0], classifications: [] }],
      expected: [],
      splitAndReturnDeletedExpected: [],
    },
  ])("$desc", ({ currDomains, newDomains, splitAndReturnDeletedExpected, expected }) => {
    const result = getDomainsDiffServer(currDomains, newDomains, { splitClassifications: false, returnDeletedClassifications: false });
    const splitResult = getDomainsDiffServer(currDomains, newDomains, {
      splitClassifications: true,
      returnDeletedClassifications: true,
    });

    sortDomains(result);
    sortDomains(splitResult);
    sortDomains(expected);
    expect(result).toEqual(expected);
    expect(splitResult).toEqual(splitAndReturnDeletedExpected);
  });
});

describe("getPermissionTablesDiff", () => {
  const permissionTableIds = [new ObjectId(), new ObjectId(), new ObjectId(), new ObjectId()] as const;
  const rowFilterKods = ["1", "2", "3"] as const;
  const values: UserRowFilter["values"] = [
    { value: 1, display_name: "zibi" },
    { value: 6, display_name: "zoobi" },
    { value: "wow", display_name: "zabka" },
    { value: "crazy", display_name: "yo" },
  ];

  test.each<{
    desc: string;
    currPermissionTables: Pick<UserPermissionTable, "id" | "row_filters">[];
    newPermissionTables: Pick<UserPermissionTable, "id" | "row_filters">[];
    expected: PermissionTableDiffServer[];
  }>([
    {
      desc: "should return permission_tables only in newPermissionTables with their row_filters",
      currPermissionTables: [],
      newPermissionTables: [{ id: permissionTableIds[0], row_filters: [{ kod: rowFilterKods[0], values: [values[0], values[1]] }] }],
      expected: [
        {
          id: permissionTableIds[0],
          row_filters: [{ kod: rowFilterKods[0], newValues: [values[0], values[1]], deletedValues: [] }],
          diffType: "new",
        },
      ],
    },
    {
      desc: "should return updated permission_tables with new row_filter",
      currPermissionTables: [{ id: permissionTableIds[0], row_filters: [{ kod: rowFilterKods[0], values: [values[0], values[1]] }] }],
      newPermissionTables: [
        {
          id: permissionTableIds[0],
          row_filters: [
            { kod: rowFilterKods[0], values: [values[0], values[1]] },
            { kod: rowFilterKods[1], values: [values[2], values[3]] },
          ],
        },
      ],
      expected: [
        {
          id: permissionTableIds[0],
          row_filters: [{ kod: rowFilterKods[1], newValues: [values[2], values[3]], deletedValues: [] }],
          diffType: "updated",
        },
      ],
    },
    {
      desc: "should return deleted permission_tables with deleted values",
      currPermissionTables: [{ id: permissionTableIds[0], row_filters: [{ kod: rowFilterKods[0], values: [values[0], values[1]] }] }],
      newPermissionTables: [],
      expected: [
        {
          id: permissionTableIds[0],
          row_filters: [{ kod: rowFilterKods[0], deletedValues: [values[0], values[1]], newValues: [] }],
          diffType: "deleted",
        },
      ],
    },
    {
      desc: "should return empty array if currDomains and newDomains are identical",
      currPermissionTables: [{ id: permissionTableIds[0], row_filters: [{ kod: rowFilterKods[0], values: [values[0], values[1]] }] }],
      newPermissionTables: [{ id: permissionTableIds[0], row_filters: [{ kod: rowFilterKods[0], values: [values[0], values[1]] }] }],
      expected: [],
    },
    {
      desc: "should handle complex differences correctly",
      currPermissionTables: [
        { id: permissionTableIds[0], row_filters: [{ kod: rowFilterKods[0], values: [values[1]] }] },
        { id: permissionTableIds[1], row_filters: [{ kod: rowFilterKods[2], values: [values[0]] }] },
        { id: permissionTableIds[3], row_filters: [{ kod: rowFilterKods[1], values: [values[3]] }] },
      ],
      newPermissionTables: [
        {
          id: permissionTableIds[0],
          row_filters: [{ kod: rowFilterKods[0], values: [values[0]] }],
        },
        { id: permissionTableIds[1], row_filters: [{ kod: rowFilterKods[2], values: [values[1]] }] },
        { id: permissionTableIds[2], row_filters: [{ kod: rowFilterKods[2], values: [values[2]] }] },
      ],
      expected: [
        {
          id: permissionTableIds[0],
          row_filters: [{ kod: rowFilterKods[0], deletedValues: [values[1]], newValues: [values[0]] }],
          diffType: "updated",
        },
        {
          id: permissionTableIds[1],
          row_filters: [{ kod: rowFilterKods[2], deletedValues: [values[0]], newValues: [values[1]] }],
          diffType: "updated",
        },
        {
          id: permissionTableIds[2],
          row_filters: [{ kod: rowFilterKods[2], deletedValues: [], newValues: [values[2]] }],
          diffType: "new",
        },
        {
          id: permissionTableIds[3],
          row_filters: [{ kod: rowFilterKods[1], deletedValues: [values[3]], newValues: [] }],
          diffType: "deleted",
        },
      ],
    },
    {
      desc: "should handle permission_tables with empty row_filters arrays",
      currPermissionTables: [{ id: permissionTableIds[0], row_filters: [] }],
      newPermissionTables: [{ id: permissionTableIds[0], row_filters: [{ kod: rowFilterKods[2], values: [values[0], values[1]] }] }],
      expected: [
        {
          id: permissionTableIds[0],
          row_filters: [{ kod: rowFilterKods[2], newValues: [values[0], values[1]], deletedValues: [] }],
          diffType: "updated",
        },
      ],
    },
    {
      desc: "should return empty array when both currDomains and newDomains are empty",
      currPermissionTables: [],
      newPermissionTables: [],
      expected: [],
    },
  ])("$desc", ({ currPermissionTables, newPermissionTables, expected }) => {
    const result = getPermissionTablesDiffServer(currPermissionTables, newPermissionTables);

    sortPermissionTables(result);
    sortPermissionTables(expected);
    expect(result).toEqual(expected);
  });
});
