import { User } from "src/octokitHelpers";

export type WriteableState = "success" | "failure" | "pending";

export function stateDisplay(state: string): string {
  switch (state) {
    case "success":
      return "Completed";
    case "failure":
      return "Rejected";
    case "pending":
      return "Cleared";
    default:
      return state;
  }
}

export interface UpdateState {
  state: WriteableState;
  user: User;
  description: string | null;
}
