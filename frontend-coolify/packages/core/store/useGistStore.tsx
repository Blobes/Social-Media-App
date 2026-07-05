import { IGist } from "@repo/core";
import { create } from "zustand";

interface GistState {
  gists: IGist[];
  setGists: (gists: IGist[]) => void;
  updateGistLike: (
    gistId: string,
    likedByMe: boolean,
    likeCount: number,
  ) => void;
  clearGists: () => void;
}

/**
 * Global store for managing gist data across micro-frontends.
 */
export const useGistStore = create<GistState>((set) => ({
  gists: [],
  setGists: (gists) => set({ gists }),

  // Updates the like status of a specific gist locally for immediate UI feedback.
  updateGistLike: (gistId, likedByMe, likeCount) =>
    set((state) => ({
      gists: state.gists.map((gist) =>
        gist._id === gistId ? { ...gist, likedByMe, likeCount } : gist,
      ),
    })),

  // Resets the gist state, typically used during logout.
  clearGists: () => set({ gists: [] }),
}));
