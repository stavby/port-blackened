const DEFAULT_MAX_LENGTH = 50;
// DEFALUT_MIN_LENGTH ? always gonna be 1 though
// important: the @LENGTH includes the min and max values as valid. for example: @LENGTH(3, 15) means value >= 3 or value <= 15

const FlowConsts = {
  table_name: { MAX: 150 },
  table_display_name: { MIN: 5, MAX: 100 },
  table_desc: {
    MIN: 0,
    MAX: 300,
  },
};

const ColumnSchemaConsts = {
  DEFAULT_MAX_LENGTH: 300,
  column_display_name: { MIN: 2, MAX: 300 },
  column_desc: { MIN: 0, MAX: 300 },
};

const CreateConnConsts = {
  connection_name: {
    MIN: 2,
    MAX: 30,
  },
  display_name: {
    MIN: 2,
    MAX: 30,
  },
  host: {
    MIN: 3,
    MAX: 200,
  },
  port: {
    MIN: 1,
    MAX: 65535,
  },
  service: {
    MAX: 30,
  },
  username: {
    MAX: 30,
  },
  password: {
    MAX: 200,
  },
  authSource: {
    MAX: 30,
  },
};

const ContactUsConsts = {
  description: {
    MIN: 1,
    MAX: 1000,
  },
};
export { DEFAULT_MAX_LENGTH, CreateConnConsts, FlowConsts, ColumnSchemaConsts, ContactUsConsts };
