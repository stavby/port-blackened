import { MaskType } from "@port/shield-models";

enum DataTypeCategory {
  DATE = "תאריך",
  NUMBER = "מספר",
  TEXT = "טקסט",
  BINARY = "בינארי",
  SPATIAL = "מרחבי",
  JSON = "ג'ייסון",
  UUID = "מזהה ייחודי",
  ARRAY = "מערך",
  XML = "XML",
  ENUM = "מונה",
  FULLTEXT = "טקסט מלא",
  NETWORK = "רשת",
}

export const dbTypeMapping = {
  // Date types
  DATE: DataTypeCategory.DATE,
  TIMESTAMP: DataTypeCategory.DATE,
  TIMESTAMPTZ: DataTypeCategory.DATE,
  DATETIME: DataTypeCategory.DATE,
  TIME: DataTypeCategory.DATE,
  INTERVAL: DataTypeCategory.DATE,
  YEAR: DataTypeCategory.DATE,
  DATS: DataTypeCategory.DATE,
  DATETIME2: DataTypeCategory.DATE,
  DATETIMEOFFSET: DataTypeCategory.DATE,

  // Number types
  NUMBER: DataTypeCategory.NUMBER,
  INT: DataTypeCategory.NUMBER,
  INTEGER: DataTypeCategory.NUMBER,
  BIGINT: DataTypeCategory.NUMBER,
  SMALLINT: DataTypeCategory.NUMBER,
  DECIMAL: DataTypeCategory.NUMBER,
  NUMERIC: DataTypeCategory.NUMBER,
  REAL: DataTypeCategory.NUMBER,
  "DOUBLE PRECISION": DataTypeCategory.NUMBER,
  FLOAT: DataTypeCategory.NUMBER,
  BIT: DataTypeCategory.NUMBER,
  TINYINT: DataTypeCategory.NUMBER,
  MEDIUMINT: DataTypeCategory.NUMBER,
  SERIAL: DataTypeCategory.NUMBER,
  MONEY: DataTypeCategory.NUMBER,
  SMALLMONEY: DataTypeCategory.NUMBER,
  NUMC: DataTypeCategory.NUMBER,
  UNIQUEIDENTIFIER: DataTypeCategory.NUMBER,
  DOUBLE: DataTypeCategory.NUMBER,
  COUNTER: DataTypeCategory.NUMBER,
  OBJECTID: DataTypeCategory.NUMBER,
  QUAN: DataTypeCategory.NUMBER,
  DOUBLE_PRECISION: DataTypeCategory.NUMBER,

  // Text types
  VARCHAR2: DataTypeCategory.TEXT,
  CHAR: DataTypeCategory.TEXT,
  NCHAR: DataTypeCategory.TEXT,
  NVARCHAR2: DataTypeCategory.TEXT,
  LONG: DataTypeCategory.TEXT,
  CLOB: DataTypeCategory.TEXT,
  NCLOB: DataTypeCategory.TEXT,
  VARCHAR: DataTypeCategory.TEXT,
  TEXT: DataTypeCategory.TEXT,
  STRING: DataTypeCategory.TEXT,
  MEDIUMTEXT: DataTypeCategory.TEXT,
  LONGTEXT: DataTypeCategory.TEXT,
  TINYTEXT: DataTypeCategory.TEXT,
  BPCHAR: DataTypeCategory.TEXT,
  NVARCHAR: DataTypeCategory.TEXT,
  CHOICE: DataTypeCategory.TEXT,
  NOTE: DataTypeCategory.TEXT,

  // Binary types
  BLOB: DataTypeCategory.BINARY,
  VARBINARY: DataTypeCategory.BINARY,
  BINARY: DataTypeCategory.BINARY,
  IMAGE: DataTypeCategory.BINARY,
  RAW: DataTypeCategory.BINARY,
  BOOLEAN: DataTypeCategory.BINARY,
  BOOL: DataTypeCategory.BINARY,
  MEDIUMBLOB: DataTypeCategory.BINARY,

  // Spatial types
  GEOMETRY: DataTypeCategory.SPATIAL,
  POINT: DataTypeCategory.SPATIAL,
  LINESTRING: DataTypeCategory.SPATIAL,
  POLYGON: DataTypeCategory.SPATIAL,
  MULTIPOINT: DataTypeCategory.SPATIAL,
  MULTILINESTRING: DataTypeCategory.SPATIAL,
  MULTIPOLYGON: DataTypeCategory.SPATIAL,
  GEOGRAPHY: DataTypeCategory.SPATIAL,

  // JSON types
  JSON: DataTypeCategory.JSON,
  JSONB: DataTypeCategory.JSON,

  // UUID types
  UUID: DataTypeCategory.UUID,

  // Array types
  ARRAY: DataTypeCategory.ARRAY,

  // XML types
  XML: DataTypeCategory.XML,

  // Enum types
  ENUM: DataTypeCategory.ENUM,
  SET: DataTypeCategory.ENUM,

  // Fulltext types
  TSVECTOR: DataTypeCategory.FULLTEXT,
  TSQUERY: DataTypeCategory.FULLTEXT,

  // Network types
  CIDR: DataTypeCategory.NETWORK,
  INET: DataTypeCategory.NETWORK,
  MACADDR: DataTypeCategory.NETWORK,
  MACADDR8: DataTypeCategory.NETWORK,
} as const satisfies { [type: string]: DataTypeCategory };

export enum ClassificationState {
  UNCLASSIFIED = "unclassified",
  PARTIALLY_CLASSIFIED = "partially_classified",
  CLASSIFIED = "classified",
  INTERNALLY_CLASSIFIED = "internally_classified",
}

export const DEFAULT_MASK = "none" satisfies MaskType;
