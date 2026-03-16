interface MongodbConfigProps {
  connectionString: string;
}

interface TrinoConfigProps {
  server: string;
  catalog?: string;
  schema?: string;
  user: string;
  password: string;
}

interface KeycloakProps {
  url: string;
  realm: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

interface ExternalApiProps {
  username: string;
  password: string;
}

interface OpaProps {
  url: string;
}

export interface ConfigProps {
  port: number;
  env: string;
  clientHost: string;
  mongodb: MongodbConfigProps;
  trino: TrinoConfigProps;
  keycloak: KeycloakProps;
  externalApi: ExternalApiProps;
  opa: OpaProps;
}
