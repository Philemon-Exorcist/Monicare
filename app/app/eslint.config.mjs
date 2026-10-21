const eslintConfig = [
  {
    ignores: [".next/**", "node_modules/**"],
  },
  {
    files: ["app/**/*.{js,jsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    rules: {
      "no-constant-condition": "error",
      "no-dupe-keys": "error",
      "no-unreachable": "error",
      "valid-typeof": "error",
    },
  },
];

export default eslintConfig;
