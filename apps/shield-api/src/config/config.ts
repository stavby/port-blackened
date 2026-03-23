import { ConfigProps } from "./config.interface";

export const config = (): ConfigProps => {
  const PORT = parseInt(process.env.PORT, 10) || 8080;
  const ENV = process.env.ENV || "PROD";

  return {
    port: PORT,
    env: ENV,
    clientHost: process.env.CLIENT_HOST,
    mongodb: {
      connectionString: process.env.MONGODB_CONNECTION_STRING,
    },
    postgres: {
      connectionString: process.env.DATABASE_URL,
    },
    trino: {
      server: process.env.TRINO_SERVER,
      user: process.env.TRINO_ADMIN_USER,
      password: process.env.TRINO_ADMIN_PASSWORD,
      catalog: process.env.TRINO_CATALOG,
      schema: process.env.TRINO_SCHEMA,
    },
    keycloak: {
      url: process.env.KEYCLOAK_URL,
      realm: process.env.KEYCLOAK_REALM,
      clientId: process.env.KEYCLOAK_CLIENT_ID,
      clientSecret: process.env.KEYCLOAK_CLIENT_SECRET,
      redirectUri: process.env.KEYCLOAK_REDIRECT_URI,
    },
    externalApi: {
      username: process.env.SHIELD_API_USER,
      password: process.env.SHIELD_API_PASSWORD,
    },
    opa: {
      url: process.env.OPA_CLIENT_URL,
    },
  };
};
