import AddIcon from "@mui/icons-material/Add";
import Alert from "@mui/material/Alert";
import Autocomplete from "@mui/material/Autocomplete";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import { useCallback, useMemo } from "react";

import { useRepos } from "src/hooks/useOwnerRepo";
import { Repository } from "src/octokitHelpers";

interface Option {
  label: string;
  id: number;
}

function repoToOption(repo: Repository): Option {
  return { label: repo.full_name, id: repo.id };
}

export default function RepoSelect(): React.ReactElement {
  // FIXME we always know this in advance, could be props here
  const { currentRepo, visibleRepos, setSelectedRepo } = useRepos();

  let options: Array<{ label: string; id: number }> = [];
  if (visibleRepos.data) {
    options = visibleRepos.data.map(repoToOption);
  }

  const setValue = useCallback(
    (newValue: Option | null) => {
      if (newValue !== null) {
        setSelectedRepo(newValue.id);
      }
    },
    [setSelectedRepo],
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
    <Stack direction="row" spacing={0} alignItems="center">
      <Autocomplete
        disableClearable
        value={value}
        onChange={(_event: any, newValue: Option | null) => {
          setValue(newValue);
        }}
        options={options}
        isOptionEqualToValue={optionEq}
        sx={{ width: 400 }}
        renderInput={(params) => <TextField {...params} label="Repository" />}
      />
      <Box>
        <IconButton
          aria-label="add repository"
          target="_blane"
          href="https://github.com/apps/qvet">
          <AddIcon />
        </IconButton>
      </Box>
    </Stack>
  );
}

function optionEq(a: Option, b: Option) {
  return a.id === b.id;
}
