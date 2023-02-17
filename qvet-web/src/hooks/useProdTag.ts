import { useQuery } from "@tanstack/react-query";
import { Octokit } from "octokit";
import useOctokit from "src/hooks/useOctokit";
import useOwnerRepo from "src/hooks/useOwnerRepo";
import { OwnerRepo } from "src/octokitHelpers";

export default function useProdTag() {
  const octokit = useOctokit();
  const ownerRepo = useOwnerRepo();

  return useQuery({
    queryKey: ["getProdTag", { ownerRepo }],
    queryFn: () => getProdTag(octokit!, ownerRepo),
    refetchInterval: GIT_REF_POLL_INTERVAL_MS,
    enabled: !!octokit,
  });
}

interface Tag {
  name: string;
  commit: {
    sha: string;
  };
}

async function getProdTag(
  octokit: Octokit,
  ownerRepo: OwnerRepo
): Promise<Tag | null> {
  const tagPages = octokit.paginate.iterator(octokit.rest.repos.listTags, {
    ...ownerRepo,
    per_page: 100,
  });

  // FIXME un-hardcode
  for await (const { data: tags } of tagPages) {
    for (const tag of tags) {
      if (
        tag.name.startsWith("prod-") &&
        !tag.name.startsWith("prod-revert-")
      ) {
        return tag;
      }
    }
  }

  return null;
}

// Five minutes
const GIT_REF_POLL_INTERVAL_MS = 5 * 60 * 1000;
