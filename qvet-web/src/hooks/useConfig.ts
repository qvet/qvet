import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { Octokit } from "octokit";
import useConfigFile from "src/hooks/useConfigFile";
import { Repository } from "src/octokitHelpers";
import YAML from "yaml";

export interface Config {
  author: {
    ignore: Array<string>;
  };
  actions: {
    ready: Action | null;
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

export default function useConfig(): UseQueryResult<Config> {
  const configFile = useConfigFile();

  return useQuery({
    queryKey: ["config", { configFile: configFile.data }],
    queryFn: () => parseConfigFile(configFile.data!),
    enabled: configFile.isSuccess,
  });
}

function parseConfigFile(configFile: string): Config {
  const raw = YAML.parse(configFile);
  // FIXME better validation and parsing
  return {
    author: {
      ignore: raw.author?.ignore ?? [],
    },
    actions: {
      ready: raw.actions?.ready ?? null,
    },
    release: {
      identifiers: raw.release?.identifiers ?? [],
    },
  };
}
