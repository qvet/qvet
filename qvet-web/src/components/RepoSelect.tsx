import { useCallback, useMemo } from "react";
import Alert from "@mui/material/Alert";
import Skeleton from "@mui/material/Skeleton";
import TextField from "@mui/material/TextField";
import Autocomplete from "@mui/material/Autocomplete";
import { useRepos } from "src/hooks/useOwnerRepo";
import { Repository } from "src/octokitHelpers";

interface Option {
  label: string;
  id: number;
}

function repoToOption(repo: Repository): Option {
  return { label: repo.full_name, id: repo.id };
}

export default function RepoSelect() {
  const { currentRepo, visibleRepos, setSelectedRepo } = useRepos();

  let options: Array<{ label: string; id: number }> = [];
  if (!!visibleRepos.data) {
    options = visibleRepos.data.map(repoToOption);
  }

  const setValue = useCallback(
    (newValue: Option | null) => {
      if (newValue !== null) {
        setSelectedRepo(newValue.id);
      }
    },
    [setSelectedRepo]
  );

  const value = useMemo((): Option | undefined => {
    if (!currentRepo.data) {
      return undefined;
    }
    return repoToOption(currentRepo.data);
  }, [currentRepo]);

  return currentRepo.isLoading || visibleRepos.isLoading ? (
    <Skeleton variant="rounded" width={450} height={56} />
  ) : currentRepo.isError || visibleRepos.isError ? (
    <Alert severity="error">"error while loading repos"</Alert>
  ) : (
    <Autocomplete
      disableClearable
      value={value}
      onChange={(event: any, newValue: Option | null) => {
        setValue(newValue);
      }}
      options={options}
      isOptionEqualToValue={optionEq}
      sx={{ width: 400 }}
      renderInput={(params) => <TextField {...params} label="Repository" />}
    />
  );
}

function optionEq(a: Option, b: Option) {
  return a.id === b.id;
}
