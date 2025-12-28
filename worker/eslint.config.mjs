import { includeIgnoreFile } from "@eslint/compat";
import eslint from "@eslint/js";
import honoEslintConfig from "@hono/eslint-config";
import eslintConfigPrettier from "eslint-config-prettier";
import tseslint from "typescript-eslint";
import { fileURLToPath } from "node:url";

const gitignorePath = fileURLToPath(new URL(".gitignore", import.meta.url));

export default tseslint.config(
  eslint.configs.recommended,
  tseslint.configs.strict,
  tseslint.configs.stylistic,
  honoEslintConfig,
  eslintConfigPrettier,
  includeIgnoreFile(gitignorePath, "Imported .gitignore patterns"),
  {
    ignores: ["eslint.config.mjs"],
  },
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: fileURLToPath(new URL(".", import.meta.url)),
      },
    },
  },
);
