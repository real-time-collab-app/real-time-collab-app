import js from "@eslint/js";
import tseslint from "typescript-eslint";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import prettier from "eslint-config-prettier";

export default tseslint.config(
  { ignores: ["**/dist/**", "**/node_modules/**", "**/.turbo/**"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["apps/frontend/**/*.{ts,tsx}"],
    plugins: { react, "react-hooks": reactHooks },
    languageOptions: { globals: globals.browser },
    rules: {
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      "react/react-in-jsx-scope": "off",
    },
    settings: { react: { version: "detect" } },
  },
  {
    files: ["apps/backend/**/*.ts"],
    languageOptions: { globals: globals.node },
  },
  prettier
);
