import config from "@port/tsup-config";
import { defineConfig } from "tsup";

export default defineConfig({ ...config, entry: ["./src/**/*"], noExternal: ["@keycloak/keycloak-admin-client"] });
