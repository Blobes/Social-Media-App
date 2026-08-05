import mongoose, { QueryFilter } from "mongoose";
import { IUserDocument } from "@repo/database";
import { InputCheckType } from "../../../types";
import { normalizeValue, transformToASCII } from "../../../utils/hash";
import { determineCheckType } from "../../../utils/sanitizeData";

export class UserQueryBuilder {
  /**
   * Resolves a single user filter from flexible identity parameters.
   */
  static resolveSingleFilter(
    identifier: string | mongoose.Types.ObjectId,
    identifierType?: InputCheckType,
  ): QueryFilter<IUserDocument> {
    if (
      identifier instanceof mongoose.Types.ObjectId ||
      mongoose.Types.ObjectId.isValid(String(identifier).trim())
    ) {
      return { _id: identifier };
    }

    const raw = String(identifier).trim();
    const formattedValue = normalizeValue(raw);
    const checkType = identifierType || determineCheckType(raw);

    if (checkType === "EMAIL") {
      return { email: formattedValue.toLowerCase() };
    }

    if (checkType === "PHONE") {
      return { phoneNumber: formattedValue.replace(/\D/g, "") };
    }

    const canonical = transformToASCII(formattedValue);
    return { usernameCanonical: canonical };
  }

  /**
   * Builds Mongoose select projection from field arrays.
   */
  static buildProjection(fields?: string[]): string | undefined {
    if (!fields || fields.length === 0) {
      return undefined;
    }

    const fieldSet = new Set(fields);
    fieldSet.add("_id");

    return Array.from(fieldSet).join(" ");
  }
}
