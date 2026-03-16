import mariadb from "./app_mariadb.svg";
import oracle from "./app_oracle.svg";
import postgres from "./app_postgres.svg";
import sap from "./app_sap.svg";
import sharepoint from "./app_sharepoint.svg";
import sqlserver from "./app_sqlserver.svg";
import xml from "./app_xml.svg";
import mongodb from "./app_mongodb.svg";
import openapi from "./app_openapi.svg";
import db2 from "./app_db2.svg";
import remix from "./app_remix.svg";
import external from "./app_external.svg";

const SourceIconsMap: { [key: string]: string } = {
  mariadb,
  oracle,
  postgres,
  sap,
  sharepoint,
  sqlserver,
  xml,
  mongodb,
  hana: sap,
  sapfunctions: sap,
  openapi,
  db2,
  remix,
  external,
  dynamic_tzodi: xml,
};

const SourceIcons = new Proxy(SourceIconsMap, {
  get(target, property) {
    if (typeof property === "string") {
      property = property.toLowerCase();
      if (property.includes("db2")) return target.db2;
      return target[property];
    }

    return "";
  },
});

export default SourceIcons;
