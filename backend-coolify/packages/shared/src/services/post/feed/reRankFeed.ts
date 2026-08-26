import { IBasePost } from "../../../types/general";

interface ReRankOptions {
  maxConsecutiveByAuthor?: number;
}

/**
 * Re-ranks scored feed payload to enforce author diversity and smooth out duplicate distributions.
 */
export const applyFeedDiversityRules = <T extends IBasePost>(
  posts: T[],
  options: ReRankOptions = {},
): T[] => {
  const { maxConsecutiveByAuthor = 2 } = options;
  const result: T[] = [];
  const pool = [...posts];

  while (pool.length > 0) {
    let candidateIndex = 0;

    // Check if adding candidateIndex violates max consecutive posts rule
    if (result.length >= maxConsecutiveByAuthor) {
      const recentAuthors = result
        .slice(-maxConsecutiveByAuthor)
        .map((p) => String(p.authorId));

      const allSameAuthor = recentAuthors.every(
        (id) => id === recentAuthors[0],
      );

      if (allSameAuthor) {
        // Find next candidate post written by a different author
        const alternateIndex = pool.findIndex(
          (p) => String(p.authorId) !== recentAuthors[0],
        );
        if (alternateIndex !== -1) {
          candidateIndex = alternateIndex;
        }
      }
    }

    const [selectedPost] = pool.splice(candidateIndex, 1);
    result.push(selectedPost);
  }

  return result;
};
