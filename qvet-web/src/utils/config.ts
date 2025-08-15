import Ajv from "ajv";
import YAML from "yaml";

const ajv = new Ajv({
  strict: true,
  allErrors: true,
  timestamp: "string",
  verbose: true,
});

const SCHEMA_AUTHOR_LOGIN = {
  type: "string",
  maxLength: 128,
};

const SCHEMA_COMMIT_IGNORE = {
  type: "object",
  properties: {
    authors: { type: "array", items: SCHEMA_AUTHOR_LOGIN, maxItems: 32 },
    merges: { type: "boolean" },
  },
  required: [],
  additionalProperties: false,
};

const SCHEMA_COMMIT = {
  type: "object",
  properties: {
    ignore: SCHEMA_COMMIT_IGNORE,
    base: { type: "string", minLength: 1, maxLength: 128 },
  },
  required: [],
  additionalProperties: false,
};

const SCHEMA_ACTION_LINK = {
  type: "object",
  properties: {
    type: { type: "string", enum: ["link"] },
    name: { type: "string", maxLength: 128 },
    url: { type: "string", maxLength: 256 },
  },
  required: ["type", "name", "url"],
  additionalProperties: false,
};

const SCHEMA_ACTION = {
  oneOf: [SCHEMA_ACTION_LINK],
};

const SCHEMA_ACTION_LOOKUP = {
  type: "object",
  properties: {
    ready: SCHEMA_ACTION,
  },
  required: [],
  additionalProperties: false,
};

const SCHEMA_COMMIT_IDENTIFIER_TAG = {
  type: "object",
  properties: {
    type: { type: "string", enum: ["tag"] },
    pattern: { type: "string", maxLength: 64 },
  },
  required: [],
  additionalProperties: false,
};

const SCHEMA_COMMIT_IDENTIFIER = {
  oneOf: [SCHEMA_COMMIT_IDENTIFIER_TAG],
};

const SCHEMA_RELEASE = {
  type: "object",
  properties: {
    identifiers: {
      type: "array",
      items: SCHEMA_COMMIT_IDENTIFIER,
      maxItems: 4,
    },
    max_pages_to_load: { type: "integer" },
  },
  required: [],
  additionalProperties: false,
};

const SCHEMA_TEAM = {
  type: "object",
  properties: {
    org: { type: "string", maxLength: 128 },
    team_slug: { type: "string", maxLength: 128 },
  },
  required: ["org", "team_slug"],
  additionalProperties: false,
};

const SCHEMA_ROUTINE_CHECK = {
  type: "object",
  properties: {
    id: { type: "string", maxLength: 36 },
    text: { type: "string", maxLength: 256 },
    url: { type: "string", maxLength: 256 },
  },
  required: ["id", "text"],
  additionalProperties: false,
};

const SCHEMA_ROUTINE_CHECKS = {
  type: "array",
  items: SCHEMA_ROUTINE_CHECK,
};

const SCHEMA_CHECK_RUN_LEVEL = {
  type: "string",
  enum: ["hidden", "info", "embargo"],
};

const SCHEMA_CHECK_RUN = {
  type: "object",
  properties: {
    name: { type: "string", maxLength: 256 },
    level: SCHEMA_CHECK_RUN_LEVEL,
    url: { type: "string", maxLength: 256 },
  },
  required: ["name", "level"],
  additionalProperties: false,
};

const SCHEMA_EXTERNAL_CHECKS = {
  type: "object",
  properties: {
    enabled: { type: "boolean" },
    default_level: SCHEMA_CHECK_RUN_LEVEL,
    items: {
      type: "array",
      items: SCHEMA_CHECK_RUN,
    },
  },
  required: ["enabled", "default_level", "items"],
  additionalProperties: false,
};

const SCHEMA = {
  type: "object",
  properties: {
    action: SCHEMA_ACTION_LOOKUP,
    commit: SCHEMA_COMMIT,
    release: SCHEMA_RELEASE,
    team: SCHEMA_TEAM,
    routine_checks: SCHEMA_ROUTINE_CHECKS,
    check_runs: SCHEMA_EXTERNAL_CHECKS,
  },
  required: [],
  additionalProperties: false,
};

export interface Config {
  action: {
    ready: Action | null;
  };
  commit: {
    ignore: {
      authors: Array<string>;
      merges: boolean;
    };
    base: string | null;
  };
  release: {
    identifiers: Array<Identifier>;
    max_pages_to_load: number | null;
  };
  team: Team | null;
  routine_checks: Array<RoutineCheck>;
  check_runs: CheckRunGlobalConfig;
}

export interface ActionLink {
  type: "link";
  name: string;
  url: string;
}
export type Action = ActionLink;

export interface Team {
  org: string;
  team_slug: string;
}

export interface IdentifierTag {
  type: "tag";
  pattern: string;
}
export type Identifier = IdentifierTag;

export interface RoutineCheck {
  id: string;
  text: string;
  url?: string;
}

export type CheckRunLevel = "hidden" | "info" | "embargo";

export interface CheckRunItemConfig {
  name: string;
  level: CheckRunLevel;
  url?: string;
}

export interface CheckRunGlobalConfig {
  enabled: true;
  default_level: CheckRunLevel;
  items: Array<CheckRunItemConfig>;
}

export interface ParseConfigFileResult {
  config: Config;
  errorsText: string | null;
}

export function parseConfigFile(configFile: string): ParseConfigFileResult {
  const raw = YAML.parse(configFile);
  const validator = ajv.compile(SCHEMA);
  const valid = validator(raw);

  const errorsText = valid ? null : ajv.errorsText(validator.errors);
  const config = valid ? standardiseConfig(raw) : standardiseConfig({});

  return { config, errorsText };
}

function standardiseConfig(raw: any): Config {
  return {
    action: {
      ready: raw.action?.ready ?? null,
    },
    commit: {
      ignore: {
        authors: raw.commit?.ignore?.authors ?? [],
        merges: raw.commit?.ignore?.merges ?? false,
      },
      base: raw.commit?.base ?? null,
    },
    release: {
      identifiers: raw.release?.identifiers ?? [
        {
          type: "tag",
          pattern: "^v",
        },
      ],
      max_pages_to_load: raw.release?.max_pages_to_load ?? null,
    },
    team: raw.team ?? null,
    routine_checks: raw.routine_checks ?? [],
    check_runs: raw.check_runs ?? {
      enabled: false,
      default_level: "hidden",
      items: [],
    },
  };
}
