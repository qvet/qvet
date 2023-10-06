import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { Octokit } from "octokit";

import useOctokit from "src/hooks/useOctokit";
import { User } from "src/octokitHelpers";
import { getTeamMembers } from "src/queries";
import { Config } from "src/utils/config";

import useConfig from "./useConfig";

export function teamMembersQuery(
  octokit: Octokit | null,
  config: UseQueryResult<Config>,
): object {
  return {
    queryKey: ["getTeamMembers", { team: config.data }],
    queryFn: () => {
      return config.data!.team
        ? getTeamMembers(octokit!, config.data!.team)
        : null;
    },
    enabled: !!octokit && !!config.data,
  };
}

export default function useTeamMembers(): UseQueryResult<Array<User>> {
  const octokit = useOctokit();
  const config = useConfig();
  return useQuery(teamMembersQuery(octokit, config));
}
