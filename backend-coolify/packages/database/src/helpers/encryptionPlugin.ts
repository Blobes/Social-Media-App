import { Schema, QueryOptions } from "mongoose";
import { decrypt, encrypt, hashLookup, isEncryptedPattern } from "./encrypt";
import { QFilter } from "../types/user";

export interface IEncryptedFieldConfig {
  field: string;
  searchable?: boolean;
}

export interface IEncryptedPluginOptions {
  fields: IEncryptedFieldConfig[];
}

/**
 * Methods required to encrypt or decrypt paths on a hydrated document.
 */
interface IEncryptableDocument {
  isModified(path: string): boolean;
  unmarkModified(path: string): void;
  get(path: string): unknown;
  set(path: string, val: unknown, options?: Record<string, unknown>): unknown;
  _doc?: Record<string, unknown>;
}

/**
 * Intercepts Mongoose document schemas to automate field transformations and blind lookups.
 */
export const encryptedFieldsPlugin = (
  schema: Schema,
  options: IEncryptedPluginOptions,
) => {
  const { fields } = options;

  // Append shadow tracking fields into database structures
  fields.forEach(({ field, searchable }) => {
    if (searchable) {
      schema.add({
        [`${field}Hash`]: {
          type: String,
          index: true,
          sparse: true,
        },
      });
    }
  });

  /**
   * Encrypts plain text values during pre-save.
   */
  const encryptDocumentFields = (doc: IEncryptableDocument) => {
    fields.forEach(({ field, searchable }) => {
      // Check direct path modification status to avoid re-encrypting unchanged paths
      if (!doc.isModified(field)) return;

      const plainValue = doc.get(field);

      if (typeof plainValue === "string" && plainValue.length > 0) {
        if (!isEncryptedPattern(plainValue)) {
          if (searchable) {
            doc.set(`${field}Hash`, hashLookup(plainValue));
          }
          doc.set(field, encrypt(plainValue));
        }
      }
    });
  };

  /**
   * Decrypts ciphertext on a hydrated document without change-tracking.
   */
  const decryptHydratedDocument = (doc: IEncryptableDocument) => {
    fields.forEach(({ field }) => {
      const cipherValue = doc._doc?.[field] ?? doc.get(field);

      if (typeof cipherValue === "string" && isEncryptedPattern(cipherValue)) {
        const decryptedValue = decrypt(cipherValue);

        if (doc._doc) {
          doc._doc[field] = decryptedValue;
        }

        doc.unmarkModified(field);
      }
    });
  };

  /**
   * Safely decrypts values across plain objects and hydrated documents.
   */
  const decryptTargetPayload = (target: unknown, isHydrated: boolean) => {
    if (!target || typeof target !== "object") return;

    if (isHydrated) {
      decryptHydratedDocument(target as IEncryptableDocument);
      return;
    }

    const plainObj = target as Record<string, unknown>;

    fields.forEach(({ field }) => {
      const cipherValue = plainObj[field];

      if (typeof cipherValue === "string" && isEncryptedPattern(cipherValue)) {
        plainObj[field] = decrypt(cipherValue);
      }
    });
  };

  // Attach lifecycle pre-save pipeline event hooks
  schema.pre("save", function () {
    encryptDocumentFields(this);
  });

  schema.pre("findOneAndUpdate", function () {
    const update = this.getUpdate() as Record<string, unknown> | null;
    if (!update) return;

    const target = (update.$set || update) as Record<string, unknown>;

    fields.forEach(({ field, searchable }) => {
      const plainValue = target[field];

      if (typeof plainValue === "string" && plainValue.length > 0) {
        if (!isEncryptedPattern(plainValue)) {
          if (searchable) {
            target[`${field}Hash`] = hashLookup(plainValue);
          }
          target[field] = encrypt(plainValue);
        }
      }
    });
  });

  // Decrypt post-init on document hydration
  schema.post("init", function (doc) {
    decryptTargetPayload(doc, true);
  });

  // Decrypt post-save without marking paths dirty
  schema.post("save", function (doc) {
    decryptTargetPayload(doc, true);
  });

  // Query middleware for lean executions (where doc is a plain JS object)
  schema.post("find", function (docs) {
    if (!docs) return;
    if (Array.isArray(docs)) {
      docs.forEach((doc) => {
        if (!doc.get) decryptTargetPayload(doc, false);
      });
    } else if (!docs.get) {
      decryptTargetPayload(docs, false);
    }
  });

  schema.post("findOne", function (doc) {
    if (doc && !doc.get) {
      decryptTargetPayload(doc, false);
    }
  });

  schema.post("findOneAndUpdate", function (doc) {
    if (doc && !doc.get) {
      decryptTargetPayload(doc, false);
    }
  });

  /**
   * Executes lookup using blind hash query chain with fallback support for unencrypted records.
   */
  schema.statics.findByEncryptedField = function (
    fieldName: string,
    plainValue: string,
    filter?: QFilter,
    options?: QueryOptions,
  ) {
    const isSearchable = fields.some(
      (f) => f.field === fieldName && f.searchable,
    );
    if (!isSearchable) {
      throw new Error(
        `Field '${fieldName}' is not configured as a searchable encrypted field.`,
      );
    }

    const blindHash = hashLookup(plainValue);
    const projection = options?.projection || options?.select || null;
    const normalizedValue = plainValue.trim().toLowerCase();

    // Query matches encrypted hash or legacy plain string
    const matchQuery = {
      $or: [
        { [`${fieldName}Hash`]: blindHash },
        { [fieldName]: normalizedValue },
        { [fieldName]: plainValue },
      ],
      ...filter,
    };

    return this.findOne(matchQuery, projection, options);
  };
};
