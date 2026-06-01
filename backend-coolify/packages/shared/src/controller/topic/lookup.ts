import { TopicModel } from "@repo/database";
import { Response } from "express";
import crypto from "crypto";
import { CACHE_KEYS, getOrSetCache } from "../../utils/redis/cache";
import { IAuthRequest } from "../../types";

interface LookupRequest extends IAuthRequest {
  body: {
    keyword?: string;
    alreadySelected?: string[]; // Array of topic titles or stringified identifiers picked by the user
  };
  query: {
    page?: string;
    limit?: string;
  };
}

/**
 * Executes paginated remote database or Upstash Redis vector lookup scans for topic categories.
 */
export const lookupTopics = async (
  req: LookupRequest,
  res: Response,
): Promise<any> => {
  const { keyword, alreadySelected = [] } = req.body;

  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const cleanKeyword = keyword ? keyword.trim() : "";

    // Generate a deterministic hash string from sorted exclusion elements to guarantee cache key safety
    const exclusionHash = crypto
      .createHash("md5")
      .update([...alreadySelected].sort().join(","))
      .digest("hex");

    const cacheKey = CACHE_KEYS.TOPICS_LOOKUP(
      cleanKeyword,
      exclusionHash,
      page,
      limit,
    );

    // Load payload vectors from Upstash memory or fall back to database index computation runs
    const { topics, totalCount } = await getOrSetCache(
      cacheKey,
      async () => {
        const filter: any = {
          title: { $nin: alreadySelected },
        };

        if (cleanKeyword !== "") {
          filter.title = {
            ...filter.title,
            $regex: cleanKeyword,
            $options: "i",
          };
        }

        const total = await TopicModel.countDocuments(filter);

        let databaseQuery = TopicModel.find(filter);

        if (cleanKeyword !== "") {
          // Prioritize high post tracking activity matches for specific matching inputs
          databaseQuery = databaseQuery.sort({ postCount: -1 });
        } else {
          // Default fallbacks prioritize structural creation points as secondary fallback constraints
          databaseQuery = databaseQuery.sort({ postCount: -1, createdAt: -1 });
        }

        const data = await databaseQuery.skip(skip).limit(limit);

        return { topics: data, totalCount: total };
      },
      300, // 5-minute time-to-live parameter duration boundary
    );

    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;

    return res.status(200).json({
      status: "SUCCESS",
      message: "Fetched topics successfully",
      payload: topics ?? [],
      metaData: {
        totalDocs: totalCount,
        totalPages,
        currentPage: page,
        limit,
        hasNextPage,
      },
    });
  } catch (error: any) {
    console.error("Taxonomy Lookup Failure Instance:", error);
    return res.status(500).json({
      status: "ERROR",
      message: error.message || "Error processing taxonomy lookup directory",
      payload: null,
    });
  }
};
