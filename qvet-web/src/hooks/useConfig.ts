import { useQuery, UseQueryResult } from "@tanstack/react-query";

import useConfigFile from "src/hooks/useConfigFile";
import {
  parseConfigFile,
  Config,
  ParseConfigFileResult,
} from "src/utils/config";

export default function useConfig(): UseQueryResult<Config> {
  const configMeta = useConfigMeta();

  return useQuery({
    queryKey: ["config", { configMeta: configMeta.data }],
    queryFn: () => configMeta.data!.parseResult.config,
    // Pure mapping function
    staleTime: Infinity,
    enabled: !!configMeta.data,
  });
}

interface ConfigMeta {
  parseResult: ParseConfigFileResult;
  repositoryFileMissing: boolean;
}

export function useConfigMeta(): UseQueryResult<ConfigMeta> {
  const configFile = useConfigFile();

  const repositoryFileMissing =
    configFile.isError && configFile.error.response.status === 404;
  return useQuery({
    queryKey: ["configMeta", { configFile: configFile.data }],
    // if we have a missing file, load a default config
    queryFn: () => {
      const parseResult = parseConfigFile(configFile.data || "");
      return {
        parseResult,
        repositoryFileMissing,
      };
    },
    // Config will always be the same from the same file
    staleTime: Infinity,
    enabled: configFile.isSuccess || repositoryFileMissing,
  });
}
