import { parser } from "typescript-eslint";
import { config as baseConfig } from "./base.js";
import eslintNestJS from "@darraghor/eslint-plugin-nestjs-typed";

/**
 * A shared ESLint configuration for NestJS apps.
 *
 * @type {import("eslint").Linter.Config}
 * */
export const nestJSConfig = [
  ...baseConfig,
  ...eslintNestJS.configs.flatRecommended,
  ...[
    {
      name: "@darraghor/nestjs-typed/no-swagger",
      rules: {
        "@darraghor/nestjs-typed/api-method-should-specify-api-response": "off",
      },
    },
  ],
  {
    languageOptions: {
      parser,
      parserOptions: {
        projectService: true,
        allowAutomaticSingleRunInference: true,
      },
    },
  },
];
