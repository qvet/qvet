import { Link } from "react-router-dom";
import { Commit } from "src/octokitHelpers";

export default function ShaLink({ commit }: { commit: Commit }) {
  return (
    <Link to={commit.html_url}>
      <code>{commit.sha.slice(0, 7)}</code>
    </Link>
  );
}
