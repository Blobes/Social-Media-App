import mongoose, {
  type QueryFilter,
  HydratedDocument,
  PopulateOptions,
} from "mongoose";
import { IUserDocument } from "@repo/database";
import { InputCheckType } from "../../../types/general";
import { UserQueryBuilder } from "./queryBuilder";

export type FetchUserMode = "SINGLE" | "MANY" | "EXISTS" | "COUNT";

export interface RepositoryFlags {
  identifierType?: InputCheckType;
  skipFilter?: boolean;
  lean?: boolean;
}

export interface RepositoryInput<
  TUser = IUserDocument,
  TFlags extends RepositoryFlags = RepositoryFlags,
> {
  identifier?: string | mongoose.Types.ObjectId;
  query?: QueryFilter<TUser>;
  select?: string[];
  mode?: FetchUserMode;
  limit?: number;
  skip?: number;
  sort?: Record<string, 1 | -1>;
  populate?: string | string[] | PopulateOptions | PopulateOptions[];
  session?: mongoose.ClientSession;
  flags?: TFlags;
}

const DEFAULT_PAGE_LIMIT = 50;
const MAX_PAGE_LIMIT = 1000;

export class UserRepository {
  /**
   * Core execution layer for all database operations on the User model.
   */
  static async execute<
    TUser = IUserDocument,
    TFlags extends RepositoryFlags = RepositoryFlags,
  >(
    input: RepositoryInput<TUser, TFlags>,
  ): Promise<
    | HydratedDocument<TUser>
    | (Partial<TUser> & { _id: mongoose.Types.ObjectId })
    | Array<HydratedDocument<TUser>>
    | Array<Partial<TUser> & { _id: mongoose.Types.ObjectId }>
    | boolean
    | number
    | null
  > {
    const {
      identifier,
      query: customQuery,
      select,
      mode = "SINGLE",
      limit,
      skip,
      sort,
      populate,
      session,
      flags,
    } = input;

    const isLean = flags?.lean ?? true;
    const skipFilter = flags?.skipFilter ?? false;
    const projection = UserQueryBuilder.buildProjection(select);

    if (!identifier && !customQuery && mode === "SINGLE") {
      return null;
    }

    // Resolving query with encrypted model statics
    let mongoQuery = UserQueryBuilder.buildQuery({
      identifier,
      identifierType: flags?.identifierType,
      customQuery: customQuery as QueryFilter<IUserDocument>,
      skipFilter,
    });

    // Fast-path boolean/count queries
    if (mode === "EXISTS") {
      const existsDoc = await mongoQuery
        .clone()
        .session(session || null)
        .findOne();
      return Boolean(existsDoc);
    }

    if (mode === "COUNT") {
      return mongoQuery
        .clone()
        .session(session || null)
        .countDocuments();
    }

    // Collection Fetching (MANY)
    if (mode === "MANY") {
      const enforcedLimit = Math.min(
        limit ?? DEFAULT_PAGE_LIMIT,
        MAX_PAGE_LIMIT,
      );

      if (session) mongoQuery = mongoQuery.session(session);
      if (projection) mongoQuery = mongoQuery.select(projection);
      if (populate)
        mongoQuery = mongoQuery.populate(
          populate as PopulateOptions | PopulateOptions[],
        );
      if (skip) mongoQuery = mongoQuery.skip(skip);
      mongoQuery = mongoQuery.limit(enforcedLimit);
      if (sort) mongoQuery = mongoQuery.sort(sort);

      if (!isLean) {
        mongoQuery = mongoQuery.lean(false);
        const docs = await mongoQuery.exec();
        return docs as unknown as Array<HydratedDocument<TUser>>;
      }

      const result = await mongoQuery.lean().exec();
      return result as unknown as Array<
        Partial<TUser> & { _id: mongoose.Types.ObjectId }
      >;
    }

    // Single Document Fetching (SINGLE)
    if (session) mongoQuery = mongoQuery.session(session);
    if (projection) mongoQuery = mongoQuery.select(projection);
    if (populate)
      mongoQuery = mongoQuery.populate(
        populate as PopulateOptions | PopulateOptions[],
      );

    if (!isLean) {
      mongoQuery = mongoQuery.lean(false);
      const doc = await mongoQuery.exec();
      return doc as unknown as HydratedDocument<TUser> | null;
    }

    const result = await mongoQuery.lean().exec();
    return result as unknown as
      | (Partial<TUser> & { _id: mongoose.Types.ObjectId })
      | null;
  }
}
