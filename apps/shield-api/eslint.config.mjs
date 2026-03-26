import { nestJSConfig } from "@port/eslint-config/nest-js";

export default [
	...nestJSConfig,
	{
		files: ["drizzle.config.ts"],
		languageOptions: {
			parserOptions: {
				projectService: {
					allowDefaultProject: ["drizzle.config.ts"],
				},
			},
		},
	},
];
