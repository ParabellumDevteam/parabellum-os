module.exports = {
  root: true,
  env: { node: true, es2022: true, browser: true },
  parserOptions: { ecmaVersion: "latest", sourceType: "module" },
  ignorePatterns: ["**/dist/**", "**/.next/**", "**/node_modules/**"],
  rules: {
    "no-unused-vars": "warn",
    "no-console": "off"
  }
};
