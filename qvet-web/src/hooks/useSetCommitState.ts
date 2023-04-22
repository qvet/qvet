import { setCommitStatus } from "src/queries";
import { WriteableState } from "src/utils/status";
import {
  useMutation,
  UseMutationResult,
  useQueryClient,
} from "@tanstack/react-query";
import useOctokit from "src/hooks/useOctokit";
import useLogin from "src/hooks/useLogin";
import useOwnerRepo from "src/hooks/useOwnerRepo";
import { Status } from "src/octokitHelpers";

export default function useSetCommitState(
  sha: string,
  state: WriteableState,
  context: string,
  description: string | null = null
): [UseMutationResult<unknown, unknown, void>, () => void] {
  const octokit = useOctokit();
  const login = useLogin();
  const ownerRepo = useOwnerRepo();

  const queryClient = useQueryClient();
  const setCommitState = useMutation(
    async () => {
      if (!login.data || !octokit || !ownerRepo.data) {
        return;
      }
      return setCommitStatus(octokit, ownerRepo.data, sha, context, {
        user: login.data,
        state,
        description,
      });
    },
    {
      // Refetch the new commit status after this call finishes
      onSuccess: async (data) => {
        if (data === null) {
          return;
        }

        // Set this data as the new data for specific status (we know it)
        queryClient.setQueryData(
          ["getCommitStatus", { ownerRepo: ownerRepo.data, sha, context }],
          data
        );

        // Invalidate any list queries to this status, must be refetched
        const queryKey = [
          "getCommitStatusList",
          { ownerRepo: ownerRepo.data, sha },
        ];
        const existingList: Array<Status> | undefined =
          queryClient.getQueryData(queryKey);
        if (existingList !== undefined) {
          const newList = new Array(data, ...existingList);
          queryClient.setQueryData(queryKey, newList);
        }
      },
    }
  );

  return [setCommitState, () => setCommitState.mutate()];
}
