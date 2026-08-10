import mongoose, { HydratedDocument } from "mongoose";
import { IUserDocument } from "@repo/database";
import {
  sanitizeUserResult,
  userPrivateFields,
  userSensitiveFields,
} from "../../../utils/sanitizeData";
import { RepositoryFlags, RepositoryInput, UserRepository } from "./repository";
import { AdditionsResult, UserHydrationService } from "./hydration";

export type FetchUserMode = "SINGLE" | "MANY" | "EXISTS" | "COUNT";

export interface FetchUserFlags extends RepositoryFlags {
  includeLanguage?: boolean;
  includeSensitiveFields?: boolean;
  includePrivateFields?: boolean;
}

export interface FetchUserInput<
  TUser = IUserDocument,
  TFlags extends FetchUserFlags = FetchUserFlags,
> extends Omit<RepositoryInput<TUser, TFlags>, "flags"> {
  flags?: TFlags;
}

export type InferAdditions<TFlags extends FetchUserFlags> =
  TFlags["includeLanguage"] extends true ? AdditionsResult : undefined;

export type FetchUserResult<
  TUser = IUserDocument,
  TFlags extends FetchUserFlags = FetchUserFlags,
> = TFlags["lean"] extends false
  ? HydratedDocument<TUser> & { additions?: InferAdditions<TFlags> }
  : TUser & {
      _id: mongoose.Types.ObjectId;
      additions?: InferAdditions<TFlags>;
    };

/**
 * Fetches a single user document or null.
 */
export async function fetchSingleUser<
  TUser = IUserDocument,
  TFlags extends FetchUserFlags = FetchUserFlags,
>(
  input: Omit<FetchUserInput<TUser, TFlags>, "mode">,
): Promise<FetchUserResult<TUser, TFlags> | null> {
  return fetchUserData<TUser, TFlags>({
    ...input,
    mode: "SINGLE",
  }) as Promise<FetchUserResult<TUser, TFlags> | null>;
}

/**
 * Fetches multiple user documents as an array.
 */
export async function fetchManyUsers<
  TUser = IUserDocument,
  TFlags extends FetchUserFlags = FetchUserFlags,
>(
  input: Omit<FetchUserInput<TUser, TFlags>, "mode">,
): Promise<Array<FetchUserResult<TUser, TFlags>>> {
  const result = await fetchUserData<TUser, TFlags>({
    ...input,
    mode: "MANY",
  });
  return (result ?? []) as Array<FetchUserResult<TUser, TFlags>>;
}

/**
 * Checks whether a user exists matching the provided query parameters.
 */
export async function checkUserExists<
  TUser = IUserDocument,
  TFlags extends FetchUserFlags = FetchUserFlags,
>(input: Omit<FetchUserInput<TUser, TFlags>, "mode">): Promise<boolean> {
  const result = await fetchUserData<TUser, TFlags>({
    ...input,
    mode: "EXISTS",
  });
  return Boolean(result);
}

/**
 * Counts user documents matching the given query filter.
 */
export async function countUsers<
  TUser = IUserDocument,
  TFlags extends FetchUserFlags = FetchUserFlags,
>(input: Omit<FetchUserInput<TUser, TFlags>, "mode">): Promise<number> {
  const result = await fetchUserData<TUser, TFlags>({
    ...input,
    mode: "COUNT",
  });
  return typeof result === "number" ? result : 0;
}

/**
 * Public facade delegating query building, execution, hydration, and optional external sanitization.
 */
export async function fetchUserData<
  TUser = IUserDocument,
  TFlags extends FetchUserFlags = FetchUserFlags,
>(
  input: FetchUserInput<TUser, TFlags>,
): Promise<
  | FetchUserResult<TUser, TFlags>
  | Array<FetchUserResult<TUser, TFlags>>
  | boolean
  | number
  | null
> {
  const { mode = "SINGLE", flags } = input;
  const isLean = flags?.lean ?? true;
  const includeSensitiveFields = flags?.includeSensitiveFields ?? false;
  const includePrivateFields = flags?.includePrivateFields ?? true;

  // Fetching raw data from database repository
  let rawResult = await UserRepository.execute<TUser, TFlags>(input);

  if (mode === "EXISTS" || mode === "COUNT" || !rawResult) {
    return rawResult as boolean | number | null;
  }

  // Hydrating auxiliary data
  if (mode === "SINGLE" && !isLean && flags?.includeLanguage) {
    const resultDoc = rawResult as Record<string, unknown>;
    if (resultDoc._id) {
      const additions = await UserHydrationService.enrichLanguage(
        resultDoc._id as mongoose.Types.ObjectId,
      );
      resultDoc.additions = {
        ...(resultDoc.additions as Record<string, unknown>),
        ...additions,
      };
    }
  }

  // Only sanitize plain lean objects. Do not strip properties from hydrated documents
  if (isLean && !includeSensitiveFields) {
    rawResult = sanitizeUserResult(
      rawResult,
      userSensitiveFields(),
    ) as typeof rawResult;
  }
  if (isLean && !includePrivateFields) {
    rawResult = sanitizeUserResult(
      rawResult,
      userPrivateFields(),
    ) as typeof rawResult;
  }

  return rawResult as
    | FetchUserResult<TUser, TFlags>
    | Array<FetchUserResult<TUser, TFlags>>;
}
