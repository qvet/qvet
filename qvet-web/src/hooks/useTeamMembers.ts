import { useQuery, UseQueryResult } from "@tanstack/react-query";
import useOctokit from "src/hooks/useOctokit";
import { getTeamMembers } from "src/queries";
import { Octokit } from "octokit";
import useConfig from "./useConfig";
import { Config } from "src/utils/config";

export function teamMembersQuery(
  octokit: Octokit | null,
  config: UseQueryResult<Config>,
) {
  return {
    queryKey: ["getTeamMembers", { team: config.data }],
    queryFn: () => {
      const users = config.data!.team ? getTeamMembers(octokit!, config.data!.team) : null;
      return users
    },
    enabled: !!octokit && !!config.data,
  };
}

export default function useTeamMembers() {
  const octokit = useOctokit();
  const config = useConfig();
  return useQuery(teamMembersQuery(octokit, config));
}
