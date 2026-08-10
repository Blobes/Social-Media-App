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

// Shape constraint for documents processed by field encryption routines.
interface IEncryptedTargetDoc {
  get(path: string): unknown;
  set(path: string, val: unknown, options?: Record<string, unknown>): unknown;
}

/**
 * Intercepts Mongoose document schemas to automate field transformations and blind lookups.
 */
export const encryptedFieldsPlugin = (
  schema: Schema,
  options: IEncryptedPluginOptions,
) => {
  const { fields } = options;

  // Dynamically append shadow tracking fields into database structures
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
   * Internal routine to translate field data into secure variants before database persistence.
   */
  const encryptDocumentFields = (doc: IEncryptedTargetDoc) => {
    fields.forEach(({ field, searchable }) => {
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
   * Restores cipher properties back to clean payload representations across documents and plain lean objects.
   */
  const decryptTargetPayload = (target: unknown) => {
    if (!target || typeof target !== "object") return;

    const doc = target as Record<string, unknown>;

    fields.forEach(({ field }) => {
      const isHydratedDoc =
        typeof (doc as unknown as IEncryptedTargetDoc).get === "function";
      const cipherValue = isHydratedDoc
        ? (doc as unknown as IEncryptedTargetDoc).get(field)
        : doc[field];

      if (typeof cipherValue === "string" && isEncryptedPattern(cipherValue)) {
        const decryptedValue = decrypt(cipherValue);

        if (isHydratedDoc) {
          (doc as unknown as IEncryptedTargetDoc).set(field, decryptedValue, {
            strict: false,
          });
        } else {
          doc[field] = decryptedValue;
        }
      }
    });
  };

  /**
   * Processes query result payloads for auto-decryption on single or batch results.
   */
  const handleQueryQueryResult = (result: unknown) => {
    if (!result) return;

    if (Array.isArray(result)) {
      result.forEach((item) => decryptTargetPayload(item));
    } else {
      decryptTargetPayload(result);
    }
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

  // Attach lifecycle post-retrieval pipeline event hooks for hydrated instances
  schema.post("init", function (doc) {
    decryptTargetPayload(doc);
  });

  schema.post("save", function (doc) {
    decryptTargetPayload(doc);
  });

  // Attach query post middleware to transparently auto-decrypt lean query results
  schema.post("find", handleQueryQueryResult);
  schema.post("findOne", handleQueryQueryResult);
  schema.post("findOneAndUpdate", handleQueryQueryResult);

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
