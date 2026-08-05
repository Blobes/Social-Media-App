import mongoose, {
  type QueryFilter,
  HydratedDocument,
  PopulateOptions,
} from "mongoose";
import { IUserDocument, UserModel } from "@repo/database";
import { InputCheckType } from "../../../types";
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

    // Build filter criteria
    let filter: QueryFilter<IUserDocument> = {};
    if (customQuery) {
      filter = customQuery as QueryFilter<IUserDocument>;
    } else if (identifier) {
      filter = UserQueryBuilder.resolveSingleFilter(
        identifier,
        flags?.identifierType,
      );
    } else if (mode === "SINGLE") {
      return null;
    }

    // Fast-path boolean/count queries
    if (mode === "EXISTS") {
      const existsDoc = await UserModel.exists(filter)
        .setOptions({
          skipFilter,
        })
        .session(session || null);
      return Boolean(existsDoc);
    }

    if (mode === "COUNT") {
      return UserModel.countDocuments(filter)
        .setOptions({ skipFilter })
        .session(session || null);
    }

    // Collection Fetching (MANY)
    if (mode === "MANY") {
      const enforcedLimit = Math.min(
        limit ?? DEFAULT_PAGE_LIMIT,
        MAX_PAGE_LIMIT,
      );

      let mongoQuery = UserModel.find(filter).setOptions({ skipFilter });

      if (session) mongoQuery = mongoQuery.session(session);
      if (projection) mongoQuery = mongoQuery.select(projection);
      if (populate) mongoQuery = mongoQuery.populate(populate as any);
      if (skip) mongoQuery = mongoQuery.skip(skip);
      mongoQuery = mongoQuery.limit(enforcedLimit);
      if (sort) mongoQuery = mongoQuery.sort(sort);

      if (!isLean) {
        const docs = await mongoQuery.exec();
        return docs as unknown as Array<HydratedDocument<TUser>>;
      }

      return mongoQuery.lean<
        Array<Partial<TUser> & { _id: mongoose.Types.ObjectId }>
      >();
    }

    // Single Document Fetching (SINGLE)
    let mongoQuery = UserModel.findOne(filter).setOptions({ skipFilter });
    if (session) mongoQuery = mongoQuery.session(session);
    if (projection) mongoQuery = mongoQuery.select(projection);
    if (populate) mongoQuery = mongoQuery.populate(populate as any);

    if (!isLean) {
      const doc = await mongoQuery.exec();
      return doc as unknown as HydratedDocument<TUser> | null;
    }

    return mongoQuery.lean<Partial<TUser> & { _id: mongoose.Types.ObjectId }>();
  }
}
