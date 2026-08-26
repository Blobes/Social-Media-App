import { IUserDocument } from "@repo/database";
import { toJwtUser, IAuthConfig } from "@repo/shared";
import { signAccessJwt, signRefreshJwt } from "./jwt";
import { getUserSecurityClaims } from "../authorization/services/securityClaims";

export type TokenTypeOption = "ALL" | "ACCESS_ONLY" | "REFRESH_ONLY";

interface IIssueAuthTokensParams {
  user: IUserDocument;
  deviceId: string;
  sessionId: string;
  authTokens: IAuthConfig;
  userAgent?: string;
  ipAddress?: string;
  includeTokens?: TokenTypeOption;
}

interface IIssueAuthTokensResult {
  accessToken?: string;
  refreshToken?: string;
}

/**
 * Resolves user security claims and selectively issues signed access and/or refresh JWT tokens based on specified options.
 */
export const issueAuthTokens = async ({
  user,
  deviceId,
  sessionId,
  authTokens,
  userAgent,
  ipAddress,
  includeTokens = "ALL",
}: IIssueAuthTokensParams): Promise<IIssueAuthTokensResult> => {
  const shouldSignAccess =
    includeTokens === "ALL" || includeTokens === "ACCESS_ONLY";
  const shouldSignRefresh =
    includeTokens === "ALL" || includeTokens === "REFRESH_ONLY";

  if (shouldSignRefresh && (!userAgent || !ipAddress)) {
    throw new Error(
      "userAgent and ipAddress are required when issuing a refresh token.",
    );
  }

  const { roles, permissions } = await getUserSecurityClaims(user._id);
  const jwtUser = toJwtUser(user, deviceId, sessionId, roles, permissions);

  const accessToken = shouldSignAccess
    ? signAccessJwt(jwtUser, sessionId, authTokens.ACCESS_TOKEN_SECRET)
    : undefined;

  const refreshToken = shouldSignRefresh
    ? await signRefreshJwt(
        jwtUser,
        sessionId,
        authTokens.REFRESH_TOKEN_SECRET,
        userAgent!,
        ipAddress!,
      )
    : undefined;

  return {
    ...(accessToken && { accessToken }),
    ...(refreshToken && { refreshToken }),
  };
};
