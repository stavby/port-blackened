const mongoose = require("mongoose");
const {
  Classification,
  ClassificationSchema,
  Domain,
  DomainSchema,
  Role,
  RoleSchema,
  PermissionTable,
  PermissionTableSchema,
  PermissionGroup,
  PermissionGroupSchema,
  Table,
  TableSchema,
  Task,
  TaskSchema,
  User,
  UserSchema,
  ApplicationUser,
  ApplicationUserSchema,
} = require("@port/shield-models");

const MONGO_URI = process.env.MONGO_URI || "mongodb://admin:password@localhost:27017/shield?authSource=admin";

function model(name, schema) {
  return mongoose.models[name] || mongoose.model(name, schema);
}

const ClassificationModel = model(Classification.name, ClassificationSchema);
const DomainModel = model(Domain.name, DomainSchema);
const RoleModel = model(Role.name, RoleSchema);
const PermissionTableModel = model(PermissionTable.name, PermissionTableSchema);
const PermissionGroupModel = model(PermissionGroup.name, PermissionGroupSchema);
const TableModel = model(Table.name, TableSchema);
const TaskModel = model(Task.name, TaskSchema);
const UserModel = model(User.name, UserSchema);
const ApplicationUserModel = model(ApplicationUser.name, ApplicationUserSchema);

const ids = {
  classifications: {
    publicData: new mongoose.Types.ObjectId("66f000000000000000000001"),
    pii: new mongoose.Types.ObjectId("66f000000000000000000002"),
    financial: new mongoose.Types.ObjectId("66f000000000000000000003"),
  },
  domains: {
    public: new mongoose.Types.ObjectId("66f000000000000000000011"),
    analytics: new mongoose.Types.ObjectId("66f000000000000000000012"),
    sales: new mongoose.Types.ObjectId("66f000000000000000000013"),
  },
  roles: {
    analyst: new mongoose.Types.ObjectId("66f000000000000000000021"),
    implementor: new mongoose.Types.ObjectId("66f000000000000000000022"),
    kapat: new mongoose.Types.ObjectId("66f000000000000000000023"),
  },
  permissionTables: {
    userAccess: new mongoose.Types.ObjectId("66f000000000000000000031"),
    eventAccess: new mongoose.Types.ObjectId("66f000000000000000000032"),
    orderAccess: new mongoose.Types.ObjectId("66f000000000000000000033"),
  },
  permissionGroups: {
    analyticsReaders: new mongoose.Types.ObjectId("66f000000000000000000041"),
    salesReaders: new mongoose.Types.ObjectId("66f000000000000000000042"),
    publicReaders: new mongoose.Types.ObjectId("66f000000000000000000043"),
  },
  tables: {
    users: new mongoose.Types.ObjectId("66f000000000000000000051"),
    events: new mongoose.Types.ObjectId("66f000000000000000000052"),
    orders: new mongoose.Types.ObjectId("66f000000000000000000053"),
    userProfiles: new mongoose.Types.ObjectId("66f000000000000000000054"),
    userActivity: new mongoose.Types.ObjectId("66f000000000000000000055"),
    sourceTable: new mongoose.Types.ObjectId("66f000000000000000000056"),
    downstreamTable: new mongoose.Types.ObjectId("66f000000000000000000057"),
  },
};

const classifications = [
  {
    _id: ids.classifications.publicData,
    name: "Public Data",
    description: "General non-sensitive data",
  },
  {
    _id: ids.classifications.pii,
    name: "PII",
    description: "Personally identifiable information",
  },
  {
    _id: ids.classifications.financial,
    name: "Financial",
    description: "Financially sensitive data",
  },
];

const domains = [
  {
    _id: ids.domains.public,
    name: "public",
    display_name: "Public",
    classifications,
  },
  {
    _id: ids.domains.analytics,
    name: "analytics",
    display_name: "Analytics",
    classifications,
  },
  {
    _id: ids.domains.sales,
    name: "sales",
    display_name: "Sales",
    classifications,
  },
];

const roles = [
  {
    _id: ids.roles.analyst,
    name: "analyst",
    display_name: "Analyst",
    color: "#3B82F6",
    display_order: 1,
  },
  {
    _id: ids.roles.implementor,
    name: "implementor",
    display_name: "Implementor",
    color: "#10B981",
    display_order: 2,
  },
  {
    _id: ids.roles.kapat,
    name: "kapat",
    display_name: "Kapat",
    color: "#F59E0B",
    display_order: 3,
  },
];

const permissionTables = [
  {
    _id: ids.permissionTables.userAccess,
    name: "user_access",
    display_name: "User Access",
    row_filters: [
      {
        kod: "department",
        display_name: "Department",
        dimensions_table: "datalake.public.dim_department",
        type: "string",
        query_builder_type: "select",
      },
    ],
    permission_keys: [{ name: "mispar_ishi", display_name: "Mispar Ishi", trino_type: "varchar" }],
  },
  {
    _id: ids.permissionTables.eventAccess,
    name: "event_access",
    display_name: "Event Access",
    row_filters: [
      {
        kod: "event_type",
        display_name: "Event Type",
        dimensions_table: "datalake.public.dim_event_type",
        type: "string",
        query_builder_type: "select",
      },
    ],
    permission_keys: [{ name: "event_id", display_name: "Event ID", trino_type: "varchar" }],
  },
  {
    _id: ids.permissionTables.orderAccess,
    name: "order_access",
    display_name: "Order Access",
    row_filters: [
      {
        kod: "region",
        display_name: "Region",
        dimensions_table: "datalake.public.dim_region",
        type: "string",
        query_builder_type: "select",
      },
    ],
    permission_keys: [{ name: "order_id", display_name: "Order ID", trino_type: "varchar" }],
  },
];

function createTable({ id, schemaName, tableName, domainId, domainName, permissionTableId }) {
  return {
    _id: id,
    catalog_name: "datalake",
    schema_name: schemaName,
    table_name: tableName,
    table_display_name: tableName.charAt(0).toUpperCase() + tableName.slice(1).replace(/_/g, " "),
    table_desc: `This is the ${tableName} table containing important business data`,
    attributes: {
      domain_id: domainId,
      domain: domainName,
      display_name: tableName.charAt(0).toUpperCase() + tableName.slice(1).replace(/_/g, " "),
    },
    permission_keys: {
      mispar_ishi: "id",
    },
    permission_table: permissionTableId,
    columns_dict: {
      id: {
        column_name: "id",
        attributes: {
          data_type: "integer",
          column_display_name: "ID",
          column_desc: "Primary identifier",
          is_key: true,
          classification: ids.classifications.publicData,
          mask: "none",
        },
      },
      name: {
        column_name: "name",
        attributes: {
          data_type: "string",
          column_display_name: "Name",
          column_desc: "Name field",
          is_key: false,
          classification: ids.classifications.publicData,
          mask: "none",
        },
      },
      created_at: {
        column_name: "created_at",
        attributes: {
          data_type: "timestamp",
          column_display_name: "Created At",
          column_desc: "Creation timestamp",
          is_key: false,
          classification: ids.classifications.publicData,
          mask: "none",
        },
      },
      email: {
        column_name: "email",
        attributes: {
          data_type: "string",
          column_display_name: "Email",
          column_desc: "Email address",
          is_key: false,
          classification: ids.classifications.pii,
          mask: "hash",
        },
      },
    },
    owner: "owner-123",
    co_owners: [{ id: "owner-456", name: "Jane Doe" }],
    source_type: "trino",
    connection: {
      display_name: "default connection",
      is_test: false,
    },
    application: "connect",
    process_type: "batch",
    schedule_type: "cron",
    schedule: "0 0 * * *",
    is_deprecated: false,
  };
}

const tables = [
  createTable({
    id: ids.tables.users,
    schemaName: "public",
    tableName: "users",
    domainId: ids.domains.public,
    domainName: "public",
    permissionTableId: ids.permissionTables.userAccess,
  }),
  createTable({
    id: ids.tables.events,
    schemaName: "analytics",
    tableName: "events",
    domainId: ids.domains.analytics,
    domainName: "analytics",
    permissionTableId: ids.permissionTables.eventAccess,
  }),
  createTable({
    id: ids.tables.orders,
    schemaName: "sales",
    tableName: "orders",
    domainId: ids.domains.sales,
    domainName: "sales",
    permissionTableId: ids.permissionTables.orderAccess,
  }),
  createTable({
    id: ids.tables.userProfiles,
    schemaName: "public",
    tableName: "user_profiles",
    domainId: ids.domains.public,
    domainName: "public",
    permissionTableId: ids.permissionTables.userAccess,
  }),
  createTable({
    id: ids.tables.userActivity,
    schemaName: "analytics",
    tableName: "user_activity",
    domainId: ids.domains.analytics,
    domainName: "analytics",
    permissionTableId: ids.permissionTables.eventAccess,
  }),
  createTable({
    id: ids.tables.sourceTable,
    schemaName: "public",
    tableName: "source_table",
    domainId: ids.domains.public,
    domainName: "public",
    permissionTableId: ids.permissionTables.userAccess,
  }),
  createTable({
    id: ids.tables.downstreamTable,
    schemaName: "public",
    tableName: "downstream_table",
    domainId: ids.domains.public,
    domainName: "public",
    permissionTableId: ids.permissionTables.userAccess,
  }),
];

const permissionGroups = [
  {
    _id: ids.permissionGroups.analyticsReaders,
    name: "analytics_readers",
    ownerId: "alice",
    ownerName: "Alice Carter",
    description: "Readers for analytics domain",
    color: "#2563EB",
    coOwners: [{ userId: "bob", userName: "Bob Nguyen" }],
    attributes: { mask: false, deceased_population: false },
    domains: [
      {
        id: ids.domains.analytics,
        classifications: [ids.classifications.publicData, ids.classifications.pii],
        given_by: "alice",
        create_date: new Date(),
        last_changed_by: "alice",
        last_change: new Date(),
      },
    ],
    permission_tables: [],
  },
  {
    _id: ids.permissionGroups.salesReaders,
    name: "sales_readers",
    ownerId: "alice",
    ownerName: "Alice Carter",
    description: "Readers for sales domain",
    color: "#16A34A",
    coOwners: [{ userId: "carla", userName: "Carla Mendez" }],
    attributes: { mask: false, deceased_population: false },
    domains: [
      {
        id: ids.domains.sales,
        classifications: [ids.classifications.publicData, ids.classifications.financial],
        given_by: "alice",
        create_date: new Date(),
        last_changed_by: "alice",
        last_change: new Date(),
      },
    ],
    permission_tables: [],
  },
  {
    _id: ids.permissionGroups.publicReaders,
    name: "public_readers",
    ownerId: "alice",
    ownerName: "Alice Carter",
    description: "Readers for public domain",
    color: "#F59E0B",
    coOwners: [{ userId: "david", userName: "David Khan" }],
    attributes: { mask: false, deceased_population: false },
    domains: [
      {
        id: ids.domains.public,
        classifications: [ids.classifications.publicData],
        given_by: "alice",
        create_date: new Date(),
        last_changed_by: "alice",
        last_change: new Date(),
      },
    ],
    permission_tables: [],
  },
];

const tasks = Object.values(ids.tables).map((tableId, index) => ({
  type: "TableClassification",
  done: index % 2 === 0,
  tableId,
  create_date: new Date(),
  modify_date: new Date(),
  aprroval_date: index % 2 === 0 ? new Date() : undefined,
  aprroval_id: index % 2 === 0 ? "alice" : undefined,
}));

const keycloakUsers = [
  { username: "alice", firstName: "Alice", lastName: "Carter", email: "alice@example.com" },
  { username: "bob", firstName: "Bob", lastName: "Nguyen", email: "bob@example.com" },
  { username: "carla", firstName: "Carla", lastName: "Mendez", email: "carla@example.com" },
  { username: "david", firstName: "David", lastName: "Khan", email: "david@example.com" },
  { username: "emma", firstName: "Emma", lastName: "Rossi", email: "emma@example.com" },
];

const users = keycloakUsers.map((user, index) => {
  const domainId = index % 3 === 0 ? ids.domains.analytics : index % 3 === 1 ? ids.domains.sales : ids.domains.public;
  const permissionGroupId =
    index % 3 === 0
      ? ids.permissionGroups.analyticsReaders
      : index % 3 === 1
        ? ids.permissionGroups.salesReaders
        : ids.permissionGroups.publicReaders;
  const domainClassifications = domainId.equals(ids.domains.analytics)
    ? [ids.classifications.publicData, ids.classifications.pii]
    : domainId.equals(ids.domains.sales)
      ? [ids.classifications.publicData, ids.classifications.financial]
      : [ids.classifications.publicData];

  return {
    user_id: user.username,
    first_name: user.firstName,
    last_name: user.lastName,
    catalogs: {
      datalake: {
        read_all: true,
        write: false,
        schemas: [],
      },
    },
    attributes: {
      mask: false,
      deceased_population: false,
      type: "חוקר",
      unique_population: [],
      impersonate: { value: false },
      blocked: false,
    },
    domains: [
      {
        id: domainId,
        classifications: domainClassifications,
        given_by: "alice",
        create_date: new Date(),
        last_changed_by: "alice",
        last_change: new Date(),
      },
    ],
    permission_tables: [],
    permission_groups: [
      {
        id: permissionGroupId,
        given_by: "alice",
        registration_date: new Date(),
      },
    ],
  };
});

const applicationUsers = keycloakUsers.map((user, index) => {
  const domainId = index % 3 === 0 ? ids.domains.analytics : index % 3 === 1 ? ids.domains.sales : ids.domains.public;
  const domainClassifications = domainId.equals(ids.domains.analytics)
    ? [ids.classifications.publicData, ids.classifications.pii]
    : domainId.equals(ids.domains.sales)
      ? [ids.classifications.publicData, ids.classifications.financial]
      : [ids.classifications.publicData];

  return {
    user_id: user.username,
    first_name: user.firstName,
    last_name: user.lastName,
    domains: [
      {
        id: domainId,
        roles: [ids.roles.analyst],
        classifications: domainClassifications,
      },
    ],
    is_admin: true,
    can_create_connections: false,
    can_manage_unique_population_indications: false,
    given_by: "alice",
    create_date: new Date(),
    last_changed_by: "alice",
    last_change: new Date(),
  };
});

async function run() {
  await mongoose.connect(MONGO_URI);

  await Promise.all([
    ClassificationModel.deleteMany({}),
    DomainModel.deleteMany({}),
    RoleModel.deleteMany({}),
    PermissionTableModel.deleteMany({}),
    PermissionGroupModel.deleteMany({}),
    TableModel.deleteMany({}),
    TaskModel.deleteMany({}),
    UserModel.deleteMany({}),
    ApplicationUserModel.deleteMany({}),
  ]);

  await ClassificationModel.insertMany(classifications);
  await DomainModel.insertMany(domains);
  await RoleModel.insertMany(roles);
  await PermissionTableModel.insertMany(permissionTables);
  await PermissionGroupModel.insertMany(permissionGroups);
  await TableModel.insertMany(tables);
  await TaskModel.insertMany(tasks);
  await UserModel.insertMany(users);
  await ApplicationUserModel.insertMany(applicationUsers);

  console.log("Seed complete:");
  console.log(`- classifications: ${classifications.length}`);
  console.log(`- domains: ${domains.length}`);
  console.log(`- roles: ${roles.length}`);
  console.log(`- permission_tables: ${permissionTables.length}`);
  console.log(`- permission_groups: ${permissionGroups.length}`);
  console.log(`- tables: ${tables.length}`);
  console.log(`- tasks: ${tasks.length}`);
  console.log(`- users: ${users.length}`);
  console.log(`- application_users: ${applicationUsers.length}`);
}

run()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
