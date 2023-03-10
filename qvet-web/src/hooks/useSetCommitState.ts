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

export default function useSetCommitState(
  sha: string,
  state: WriteableState
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
      return setCommitStatus(octokit, ownerRepo.data, sha, {
        user: login.data,
        state,
      });
    },
    {
      // Refetch the new commit status after this call finishes
      onSuccess: async (data) => {
        if (data === null) {
          return;
        }
        queryClient.setQueryData(
          ["getCommitStatus", { ownerRepo: ownerRepo.data, sha }],
          data
        );
      },
    }
  );

  return [setCommitState, () => setCommitState.mutate()];
}
