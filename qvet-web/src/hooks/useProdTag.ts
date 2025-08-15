import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { Octokit } from "octokit";

import useConfig from "src/hooks/useConfig";
import useOctokit from "src/hooks/useOctokit";
import useOwnerRepo from "src/hooks/useOwnerRepo";
import { OwnerRepo } from "src/octokitHelpers";
import { Config } from "src/utils/config";

export default function useProdTag(): UseQueryResult<Tag | null> {
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

const DEFAULT_MAX_TAG_PAGES_TO_LOAD = 20;

async function getProdTag(
  octokit: Octokit,
  ownerRepo: OwnerRepo,
  config: Config,
): Promise<Tag | null> {
  const maxPages: number =
    config.release.max_pages_to_load ?? DEFAULT_MAX_TAG_PAGES_TO_LOAD;
  const tagPages = octokit.paginate.iterator(
    octokit.rest.repos.listTags as any,
    {
      ...ownerRepo,
      per_page: 100,
    },
  );

  const regexes: Array<RegExp> = config.release.identifiers.map(
    (identifier) => new RegExp(identifier.pattern),
  );

  let page_index = 0;
  for await (const page of tagPages) {
    const tags: Array<Tag> = page.data;
    for (const tag of tags) {
      for (const regex of regexes) {
        if (tag.name.match(regex)) {
          return tag;
        }
      }
    }

    // FIXME better pagination/finding of prod tag
    page_index += 1;
    if (page_index >= maxPages) {
      break;
    }
  }

  return null;
}

// Five minutes
const GIT_REF_POLL_INTERVAL_MS = 5 * 60 * 1000;
