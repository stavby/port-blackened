import { preferredUsernameSchema, userIdSchema } from "@port/common-schemas";
import { z } from "zod";

export interface KeycloakConfig {
  baseUrl: string;
  realmName: string;
  clientId: string;
  clientSecret: string;
}

export const keycloakUserDto = z.object({
  userId: userIdSchema,
  preferredUsername: preferredUsernameSchema,
  name: z.string(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().optional(),
  shemYechida: z.string().optional(),
  shemDarga: z.string().optional(),
  shemSugSherut: z.string().optional(),
});

export type KeycloakUserDto = z.infer<typeof keycloakUserDto>;
