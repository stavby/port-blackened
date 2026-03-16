import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const NODE_ENV = z.enum(["dev", "test", "prod"]);

const envSchema = z.object({
  MONGODB_CONNECTION_STRING: z.string().nonempty(),
  BASIC_AUTH_USER: z.string().nonempty(),
  BASIC_AUTH_PASSWORD: z.string().nonempty(),
  NODE_ENV: NODE_ENV.default("prod"),
});

export const env = process.env.NODE_ENV === NODE_ENV.enum.test ? ({} as z.infer<typeof envSchema>) : envSchema.parse(process.env);
