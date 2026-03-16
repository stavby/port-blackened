import { PreferredUsername, UserID } from "@port/common-schemas";

export interface KeycloakAuthenticatedUser {
  name: string;
  preferred_username: PreferredUsername;
  given_name: string;
  family_name: string;
  email: string;
}

export interface LoggedUser {
  userId: UserID;
  preferredUsername: KeycloakAuthenticatedUser["preferred_username"];
  displayName: KeycloakAuthenticatedUser["name"];
  email: KeycloakAuthenticatedUser["email"];
}

export interface BasicAuthenticatedUser {
  userId: UserID;
}
