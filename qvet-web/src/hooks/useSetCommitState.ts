import { WriteableState, setCommitStatus } from "src/queries";
import {
  UseQueryResult,
  useMutation,
  UseMutationResult,
  useQueryClient,
} from "@tanstack/react-query";
import useOctokit from "src/hooks/useOctokit";
import useLogin from "src/hooks/useLogin";
import { useContext } from "react";
import { OwnerRepoContext } from "src/octokitHelpers";

export default function useSetCommitState(
  status: UseQueryResult<unknown>,
  sha: string,
  state: WriteableState
): [UseMutationResult<unknown, unknown, void>, () => void] {
  const octokit = useOctokit();
  const login = useLogin();
  const ownerRepo = useContext(OwnerRepoContext);

  const queryClient = useQueryClient();
  const setCommitState = useMutation(
    async () => {
      if (!login.data) {
        return;
      }
      return setCommitStatus(octokit, ownerRepo, sha, login.data.login, state);
    },
    {
      // Refetch the new commit status after this call finishes
      onSuccess: async (data) => {
        if (data === null) {
          return;
        }
        queryClient.setQueryData(["getCommitStatus", { ownerRepo, sha }], data);
      },
    }
  );

  return [setCommitState, () => setCommitState.mutate()];
}
