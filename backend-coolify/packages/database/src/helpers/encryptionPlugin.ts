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
  const encryptDocumentFields = (doc: any) => {
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
   * Internal routine to restore cipher properties back to clean payload representations.
   */
  const decryptDocumentFields = (doc: any) => {
    if (!doc) return;
    fields.forEach(({ field }) => {
      const cipherValue = doc.get(field);
      if (typeof cipherValue === "string" && isEncryptedPattern(cipherValue)) {
        doc.set(field, decrypt(cipherValue), { strict: false });
      }
    });
  };

  // Attach lifecycle pre-save pipeline event hooks
  schema.pre("save", function () {
    encryptDocumentFields(this);
  });

  schema.pre("findOneAndUpdate", function () {
    const update: any = this.getUpdate();
    if (!update) return;

    const target = update.$set || update;

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

  // Attach lifecycle post-retrieval pipeline event hooks
  schema.post("init", function (doc) {
    decryptDocumentFields(doc);
  });

  schema.post("save", function (doc) {
    decryptDocumentFields(doc);
  });

  /**
   * Executes lookup using blind hash query chain, supporting standard Mongoose query methods.
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

    return this.findOne(
      {
        [`${fieldName}Hash`]: blindHash,
        ...filter,
      },
      null,
      options,
    );
  };
};
