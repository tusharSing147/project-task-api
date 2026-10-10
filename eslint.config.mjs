import tseslint from "typescript-eslint";

// `globals` and `@eslint/js` are not installed in this repo, so browser/node
// globals are declared inline and the config is built from typescript-eslint.
const nodeGlobals = {
  globalThis: "readonly",
  global: "readonly",
  process: "readonly",
  console: "readonly",
  Buffer: "readonly",
  module: "readonly",
  require: "readonly",
  exports: "writable",
  __dirname: "readonly",
  __filename: "readonly",
  setTimeout: "readonly",
  clearTimeout: "readonly",
  setInterval: "readonly",
  clearInterval: "readonly",
  setImmediate: "readonly",
  clearImmediate: "readonly",
  URL: "readonly",
  fetch: "readonly",
};

const unusedVarsOptions = [
  "error",
  { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
];

export default tseslint.config(
  {
    ignores: [
      "node_modules/**",
      "dist/**",
      "coverage/**",
      "prisma/migrations/**",
    ],
  },
  ...tseslint.configs.recommended,
  {
    files: ["**/*.ts", "**/*.tsx", "**/*.mts", "**/*.cts"],
    languageOptions: {
      globals: nodeGlobals,
    },
    rules: {
      "no-undef": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": unusedVarsOptions,
    },
  },
  {
    files: ["**/*.js", "**/*.mjs", "**/*.cjs"],
    languageOptions: {
      globals: nodeGlobals,
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": unusedVarsOptions,
    },
  },
);
