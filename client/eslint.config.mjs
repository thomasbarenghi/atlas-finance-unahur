import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier";
import preferArrow from "eslint-plugin-prefer-arrow";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "android/**",
    "ios/**",
    "next-env.d.ts",
  ]),
  {
    plugins: { "prefer-arrow": preferArrow },
    rules: {
      "prefer-arrow/prefer-arrow-functions": [
        "error",
        {
          disallowPrototype: true,
          singleReturnOnly: false,
          classPropertiesAllowed: false,
        },
      ],
    },
  },
  {
    files: ["components/ui/**"],
    rules: {
      "prefer-arrow/prefer-arrow-functions": "off",
    },
  },
  prettier,
]);

export default eslintConfig;
