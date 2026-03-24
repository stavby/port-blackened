1. Run Docker services:
   - `docker compose up -d`

2. Bootstrap OpenFGA (run in bash):
   - `./openfga/bootstrap.sh`

3. Seed mongo mock data in Shield API workspace:
   - `npm run seed:mock-data -w @port/shield-api`

4. Link your Git repository to a Postman workspace and run both mock servers:
   - Lens Handler mock: `node postman/mocks/mock.js` (port `4500`)
   - OPA mock: `node postman/mocks/mock-1.js` (port `4501`)

5. Add `.env` files for `shield-api` and `shield-client`:
   - Create `apps/shield-api/.env` from `apps/shield-api/.env.example` and set values from compose + init SQL + mock ports, including:
     - `MONGODB_CONNECTION_STRING=mongodb://admin:password@localhost:27017/shield?authSource=admin`
     - `DATABASE_URL=postgresql://admin:password@localhost:5432/datalake`
     - `TRINO_SERVER=http://localhost:8090`
     - `TRINO_CATALOG=datalake`
     - `TRINO_SCHEMA=public`
     - `TRINO_ADMIN_USER=trino`
     - `TRINO_ADMIN_PASSWORD=trino`
     - `KEYCLOAK_URL=http://localhost:8081`
     - `KEYCLOAK_REALM=port-dev`
     - `KEYCLOAK_CLIENT_ID=shield-client`
     - `KEYCLOAK_CLIENT_SECRET=crazy-secret`
     - `FGA_API_URL=http://localhost:8082`
     - `LENS_HANDLER_URL=http://localhost:4500`
     - `OPA_CLIENT_URL=http://localhost:4501`
   - Create `apps/shield-client/.env` from `apps/shield-client/example.env` and set:
     - `VITE_ENV=local`
     - `VITE_APP_BACKEND=http://localhost:8080`
     - `VITE_PLATFORM_URL=idc`
     - `VITE_MUI_LICENSE_KEY=check discord`

6. Authentication:
   - To authenticate, use one of the user credentials listed in `keycloak/realm-import/port-dev-realm.json`.
