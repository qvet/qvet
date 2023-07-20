module.exports = {
  env: {
    browser: true,
    es6: true,
  },
  parser: "@typescript-eslint/parser",
  parserOptions: {
    sourceType: "module",
    ecmaFeatures: {
      jsx: true,
    },
  },
  settings: {
    react: {
      version: "detect",
    },
  },
  root: true,
  plugins: ["import", "@typescript-eslint", "@tanstack/query", "sonarjs"],
  extends: [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:prettier/recommended",
    "plugin:react-hooks/recommended",
    "plugin:@tanstack/eslint-plugin-query/recommended",
    "plugin:sonarjs/recommended"
  ],
  rules: {
    // Enabled
    "@typescript-eslint/adjacent-overload-signatures": "error",
    "@typescript-eslint/array-type": [
      "error",
      {
        default: "generic",
      },
    ],
    "@typescript-eslint/ban-types": "error",
    "@typescript-eslint/explicit-module-boundary-types": "error",
    "@typescript-eslint/member-ordering": "error",
    "@typescript-eslint/no-empty-function": "error",
    "@typescript-eslint/no-empty-interface": "error",
    "@typescript-eslint/no-misused-new": "error",
    "@typescript-eslint/no-redeclare": [
      "error",
      {
        ignoreDeclarationMerge: true,
      },
    ],
    "@typescript-eslint/no-this-alias": "error",
    "@typescript-eslint/no-unused-expressions": [
      "error",
      {
        allowTernary: true,
        allowShortCircuit: true,
      },
    ],
    "@typescript-eslint/no-unused-vars": [
      "error",
      {
        varsIgnorePattern: "^_.",
        argsIgnorePattern: "^_",
        ignoreRestSiblings: true,
      },
    ],
    "@typescript-eslint/prefer-as-const": "error",
    "@typescript-eslint/prefer-for-of": "error",
    "@typescript-eslint/prefer-function-type": "error",
    "@typescript-eslint/prefer-namespace-keyword": "error",
    eqeqeq: ["error", "smart"],
    "import/order": [
      "error",
      {
        alphabetize: {
          order: "asc",
          caseInsensitive: false,
        },
        groups: [
          "builtin",
          "external",
          "internal",
          "parent",
          "sibling",
          "index",
        ],
        pathGroups: [
          {
            pattern: "mswHandlers/**",
            group: "internal",
          },
          {
            pattern: "assets/**",
            group: "internal"
          },
          {
            pattern: "src/**",
            group: "internal",
          },
          {
            pattern: "test/**",
            group: "internal",
          },
        ],
        pathGroupsExcludedImportTypes: ["builtin"],
        "newlines-between": "always",
      },
    ],
    "no-bitwise": "error",
    "no-caller": "error",
    "no-case-declarations": "error",
    "no-cond-assign": "error",
    "no-console": ["error", { allow: ["warn", "error"] }],
    "no-constant-condition": "error",
    "no-debugger": "error",
    "no-duplicate-case": "error",
    "no-empty": "error",
    "no-empty-pattern": "error",
    "no-eval": "error",
    "no-extra-bind": "error",
    "no-fallthrough": "error",
    "no-new-func": "error",
    "no-new-wrappers": "error",
    "no-prototype-builtins": "error",
    "no-return-await": "error",
    "no-sequences": "error",
    "no-sparse-arrays": "error",
    "no-template-curly-in-string": "error",
    "no-throw-literal": "error",
    "no-trailing-spaces": "error",
    "no-undef-init": "error",
    "no-unsafe-finally": "error",
    "no-unused-labels": "error",
    "no-var": "error",
    "object-shorthand": "error",
    "one-var": ["error", "never"],
    "prefer-const": "error",
    "prefer-object-spread": "error",
    "react-hooks/exhaustive-deps": "error",
    "react-hooks/rules-of-hooks": "error",
    "react/jsx-no-comment-textnodes": "error",
    "react/jsx-no-target-blank": "error",
    "react/no-children-prop": "error",
    "react/no-find-dom-node": "error",
    "use-isnan": "error",

    // Disabled
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/no-inferrable-types": "off",
    "@typescript-eslint/no-namespace": "off",
    "@typescript-eslint/no-non-null-assertion": "off",
    "@typescript-eslint/no-var-requires": "off",
    "@typescript-eslint/parser": "off",
    "no-redeclare": "off", // using @typescript-eslint/no-redeclare instead
    "no-shadow": "off",
    "no-underscore-dangle": "off",
    "no-unused-vars": "off", // using the typescript rule instead
    "no-useless-escape": "off",
    "react/display-name": "off",
    "react/no-unescaped-entities": "off",
    "react/prop-types": "off",
    "sonarjs/cognitive-complexity": "off", // turning this off as it causes too many issues for the time being (mainly due to reducers)
    "sonarjs/no-duplicate-string": "off", // turning this off as it doesn't make sense in our situation
  },
  overrides: [
    {
      // Ensure that we get appropriate linting errors in our NodeJS files,
      files: ["*.js"],
      env: {
        node: true,
      },
    },
  ],
};
