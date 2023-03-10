import { create, StoreApi, UseBoundStore } from "zustand";
import { OwnerRepo } from "src/octokitHelpers";

interface Store {
  repoId: number | null;
  setRepoId: (repoId: number) => void;
}

const useStore: UseBoundStore<StoreApi<Store>> = create(
  (set): Store => ({
    repoId: null,
    setRepoId: (repoId: number) => set(() => ({ repoId })),
  })
);
export default useStore;
