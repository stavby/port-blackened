import { FGADomainRelations } from "@port/openfga-client";
import { RoleName } from "@port/shield-schemas";

export type ManageShieldRoles = Extract<FGADomainRelations, `can_manage_${RoleName}s`>;
