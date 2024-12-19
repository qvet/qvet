import { routineCheckContext } from "src/components/RoutineChecks";
import { RoutineCheck } from "src/utils/config";

import { useCommitStatuses } from "./useCommitStatus";

export default function useRoutineChecksComplete(
  sha: string,
  checks: ReadonlyArray<RoutineCheck>,
): boolean {
  const rountineCheckStatusQueries = useCommitStatuses(
    sha,
    checks.map(routineCheckContext),
  );

  for (const query of rountineCheckStatusQueries) {
    if (query.isLoading) {
      return false;
    }
  }
  for (const query of rountineCheckStatusQueries) {
    if (query.isError) {
      // if any responses have errored assume checks are complete, to not block
      return true;
    }
  }
  return rountineCheckStatusQueries.every(
    (query) => query.data?.state === "success",
  );
}
