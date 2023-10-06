import { useMutation, UseMutationResult } from "@tanstack/react-query";
import ky from "ky";

export default function useLogout(): [
  UseMutationResult<unknown, unknown, void>,
  () => void,
] {
  const setLogout = useMutation({
    mutationFn: logout,
    onSuccess: async (_data) => {
      // eslint-disable-next-line no-self-assign
      window.location.href = window.location.href;
    },
  });

  return [setLogout, () => setLogout.mutate()];
}

async function logout(): Promise<void> {
  await ky.post("/api/oauth2/logout");
}
