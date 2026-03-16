import { PreferredUsername } from "@port/common-schemas";

interface ContactUser {
  id: PreferredUsername;
  name: string;
  email: string;
}

export { ContactUser };
