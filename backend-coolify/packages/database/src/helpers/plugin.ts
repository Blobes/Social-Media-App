import { Schema } from "mongoose";
import { decrypt, encrypt, hashLookup, isEncryptedPattern } from "./encrypt";

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

    // Check raw operations or standard tracking objects
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

  // Register generalized custom query helper method binding
  schema.statics.findByEncryptedField = async function (
    fieldName: string,
    plainValue: string,
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

    //  First, try to find the user using the blind hash (for already encrypted data)
    let user = await this.findOne({ [`${fieldName}Hash`]: blindHash });

    if (!user) {
      //  If not found by hash, try finding by the plain value (for legacy/unencrypted data)
      user = await this.findOne({ [fieldName]: plainValue });

      if (user) {
        // If a user is found by plain value, it means this record is unencrypted.
        // We should encrypt this field and save the document to migrate it on access.
        console.warn(
          `[Encryption Plugin] Migrating unencrypted field '${fieldName}' for user ID: ${user._id}`,
        );
        // The pre('save') hook will handle the encryption and hashing.
        user.set(fieldName, plainValue); // Re-set the field to trigger the pre-save hook
        await user.save(); // Save the document to persist the encrypted value and hash
        // The post('save') hook will immediately decrypt it back for the current retrieval
      }
    }
    return user;
  };
};
