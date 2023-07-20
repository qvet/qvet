import ky from "ky";
import { useMutation, UseMutationResult } from "@tanstack/react-query";

export default function useLogout(): [
  UseMutationResult<unknown, unknown, void>,
  () => void,
] {
  const setLogout = useMutation(logout, {
    onSuccess: async (data) => {
      window.location.href = window.location.href;
    },
  });

  return [setLogout, () => setLogout.mutate()];
}

async function logout(): Promise<void> {
  await ky.post("/api/oauth2/logout");
}
