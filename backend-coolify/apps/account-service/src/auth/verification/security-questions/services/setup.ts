import { fetchSingleUser, MESSAGES_REGISTRY, TransInfo } from "@repo/shared";
import { Types } from "mongoose";
import { encryptPass } from "../../../helpers/encrypt";
import { SecurityQuestionModel } from "@repo/database";

export interface ISecurityQuestionInput {
  question: string;
  answer: string;
}

export interface ISetupSecurityQuestionsInput {
  userId: string;
  questions: ISecurityQuestionInput[];
}

export interface ISetupSecurityQuestionsResult {
  status: "SUCCESS" | "INVALID_INPUT" | "NOT_FOUND" | "SERVER_ERROR";
  transInfo: TransInfo;
  payload: {
    isMfaActive: boolean;
  } | null;
}

/**
 * Configures exactly 3 unique security question/answer pairs for a user.
 */
export const executeSetupSecurityQuestions = async (
  input: ISetupSecurityQuestionsInput,
): Promise<ISetupSecurityQuestionsResult> => {
  const { userId, questions } = input;

  // Validate presence and exact quantity
  if (!questions || !Array.isArray(questions) || questions.length !== 3) {
    return {
      status: "INVALID_INPUT",
      transInfo: MESSAGES_REGISTRY.AUTH.SECURITY_QUESTIONS_EXACT_THREE_REQUIRED,
      payload: null,
    };
  }

  // Validate structure and content non-emptiness
  for (const q of questions) {
    if (!q.question || !q.answer || !q.question.trim() || !q.answer.trim()) {
      return {
        status: "INVALID_INPUT",
        transInfo: MESSAGES_REGISTRY.AUTH.INVALID_SECURITY_QUESTION_INPUT,
        payload: null,
      };
    }
  }

  // Ensure selected questions are unique
  const uniqueQuestions = new Set(questions.map((q) => q.question.trim()));
  if (uniqueQuestions.size !== questions.length) {
    return {
      status: "INVALID_INPUT",
      transInfo: MESSAGES_REGISTRY.AUTH.DUPLICATE_SECURITY_QUESTIONS,
      payload: null,
    };
  }

  const user = await fetchSingleUser({
    identifier: userId,
    flags: { lean: false, skipFilter: true },
  });

  if (!user) {
    return {
      status: "NOT_FOUND",
      transInfo: MESSAGES_REGISTRY.AUTH.USER_NOT_FOUND,
      payload: null,
    };
  }

  // Process and hash all 3 answers
  const hashedQuestions = await Promise.all(
    questions.map(async (item) => ({
      question: item.question.trim(),
      answerHash: await encryptPass(item.answer.trim()),
    })),
  );

  // Upsert the security question record and fetch the created/updated document instance
  const securityDoc = await SecurityQuestionModel.findOneAndUpdate(
    { userId: new Types.ObjectId(userId) },
    { questions: hashedQuestions },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  // Link reference and activate MFA state on the target user document
  user.securityQuestionsId = securityDoc._id as Types.ObjectId;
  user.hasEnabledMFA = true;
  await user.save();

  return {
    status: "SUCCESS",
    transInfo: MESSAGES_REGISTRY.AUTH.SECURITY_QUESTIONS_SETUP_SUCCESS,
    payload: {
      isMfaActive: true,
    },
  };
};
