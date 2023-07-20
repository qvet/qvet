import { useQuery } from "@tanstack/react-query";
import { Octokit } from "octokit";
import useOctokit from "src/hooks/useOctokit";
import useConfig from "src/hooks/useConfig";
import { Config } from "src/utils/config";
import useOwnerRepo from "src/hooks/useOwnerRepo";
import { OwnerRepo } from "src/octokitHelpers";

export default function useProdTag() {
  const octokit = useOctokit();
  const ownerRepo = useOwnerRepo();
  const config = useConfig();

  return useQuery({
    queryKey: [
      "getProdTag",
      { ownerRepo: ownerRepo.data, config: config.data },
    ],
    queryFn: () => getProdTag(octokit!, ownerRepo.data!, config.data!),
    refetchInterval: GIT_REF_POLL_INTERVAL_MS,
    staleTime: GIT_REF_POLL_INTERVAL_MS,
    enabled: !!octokit && !!ownerRepo.data && !!config.data,
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
  ownerRepo: OwnerRepo,
  config: Config,
): Promise<Tag | null> {
  const tagPages = octokit.paginate.iterator(octokit.rest.repos.listTags, {
    ...ownerRepo,
    per_page: 100,
  });

  const regexes: Array<RegExp> = config.release.identifiers.map(
    (identifier) => new RegExp(identifier.pattern),
  );

  let page = 0;
  for await (const { data: tags } of tagPages) {
    for (const tag of tags) {
      for (const regex of regexes) {
        if (tag.name.match(regex)) {
          return tag;
        }
      }
    }

    // FIXME better pagination
    page += 1;
    if (page > 2) {
      break;
    }
  }

  return null;
}

// Five minutes
const GIT_REF_POLL_INTERVAL_MS = 5 * 60 * 1000;
