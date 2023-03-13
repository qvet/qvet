import Ajv from "ajv";
import YAML from "yaml";

const ajv = new Ajv({ strict: true, allErrors: true, timestamp: "string" });

const SCHEMA_AUTHOR_LOGIN = {
  type: "string",
  maxLength: 128,
};

const SCHEMA_COMMIT_IGNORE = {
  type: "object",
  properties: {
    authors: { type: "array", items: SCHEMA_AUTHOR_LOGIN, maxItems: 32 },
  },
  required: [],
  additionalProperties: false,
};

const SCHEMA_COMMIT = {
  type: "object",
  properties: {
    ignore: SCHEMA_COMMIT_IGNORE,
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
  },
  required: [],
  additionalProperties: false,
};

const SCHEMA = {
  type: "object",
  properties: {
    actions: SCHEMA_ACTION_LOOKUP,
    commit: SCHEMA_COMMIT,
    release: SCHEMA_RELEASE,
  },
  required: [],
  additionalProperties: false,
};

export interface Config {
  actions: {
    ready: Action | null;
  };
  commit: {
    ignore: {
      authors: Array<string>;
    };
  };
  release: {
    identifiers: Array<Identifier>;
  };
}

export interface ActionLink {
  type: "link";
  name: string;
  url: string;
}
export type Action = ActionLink;

export interface IdentifierTag {
  type: "tag";
  pattern: string;
}
export type Identifier = IdentifierTag;

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

// FIXME remove defaults from hardcoding
function standardiseConfig(raw: any): Config {
  return {
    actions: {
      ready: raw.actions?.ready ?? null,
    },
    commit: {
      ignore: {
        authors: raw.commit?.ignore?.authors ?? ["rebors[bot]"],
      },
    },
    release: {
      identifiers: raw.release?.identifiers ?? [
        {
          type: "tag",
          pattern: "^v",
        },
        {
          type: "tag",
          pattern: "^prod-[0-9]",
        },
      ],
    },
  };
}
