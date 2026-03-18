import {
  checkEmailReputation,
  checkPhoneIntelligence,
  checkWikipedia,
} from "../../services/user/publicStatus";

export interface NotabilityVerdict {
  isVIPCandidate: boolean;
  score: number;
  signals: {
    notableName: boolean;
    proEmail: boolean;
    validPhone: boolean;
  };
  recommendation: "REQUIRE_ID" | "STANDARD_FLOW";
}

export const evaluateNotability = async (
  fullName: string,
  email: string,
  phone?: string, // Marked as optional
): Promise<NotabilityVerdict> => {
  // 1. Fire Wikipedia and Email checks immediately
  const notableNamePromise = checkWikipedia(fullName);
  const proEmailPromise = checkEmailReputation(email);

  // 2. Only fire Phone check if a phone number was actually provided
  const validPhonePromise = phone
    ? checkPhoneIntelligence(phone)
    : Promise.resolve(false);

  const [notableName, proEmail, validPhone] = await Promise.all([
    notableNamePromise,
    proEmailPromise,
    validPhonePromise,
  ]);

  // Calculate signal count for internal ranking
  const signalCount = [notableName, proEmail, validPhone].filter(
    Boolean,
  ).length;

  /**
   * A user is a VIP Candidate if:
   * (They have a Notable Name) AND (Either a Professional Email OR a Verified Phone)
   */
  const isVIPCandidate = notableName && (proEmail || validPhone);

  return {
    isVIPCandidate,
    score: signalCount,
    signals: { notableName, proEmail, validPhone },
    recommendation: isVIPCandidate ? "REQUIRE_ID" : "STANDARD_FLOW",
  };
};
