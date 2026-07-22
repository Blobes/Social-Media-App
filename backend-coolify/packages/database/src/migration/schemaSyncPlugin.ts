import { Schema, SchemaType } from "mongoose";

/**
 * A Mongoose plugin to ensure that schema-defined default values are applied
 * to documents before saving, especially for `findOneAndUpdate` operations
 * where defaults might not be automatically set for omitted fields.
 */
export const schemaSyncPlugin = (schema: Schema) => {
  // Helper to check if a property is a direct property (not inherited)
  const hasOwnProperty = (obj: any, prop: string) =>
    Object.prototype.hasOwnProperty.call(obj, prop);

  // Logic to apply defaults to a document instance (for pre('save'))
  const applyDefaultsToDocument = (doc: any) => {
    schema.eachPath((pathName, schemaType: SchemaType) => {
      // Only apply if path has a default and the current document field is undefined or null
      // We check against `doc.get(pathName)` to respect Mongoose's getter/setter logic
      if (
        schemaType.options &&
        hasOwnProperty(schemaType.options, "default") &&
        (doc.get(pathName) === undefined || doc.get(pathName) === null)
      ) {
        doc.set(pathName, schemaType.options.default);
      }
    });
  };

  // Logic to apply defaults to an update object (for pre('findOneAndUpdate'))
  const applyDefaultsToUpdate = (update: any) => {
    schema.eachPath((pathName, schemaType: SchemaType) => {
      // If the field is not present in the update object (or its $set part) and has a default, add it
      if (
        schemaType.options &&
        hasOwnProperty(schemaType.options, "default") &&
        !hasOwnProperty(update, pathName) &&
        !(update.$set && hasOwnProperty(update.$set, pathName))
      ) {
        const defaultValue = schemaType.options.default;
        if (update.$set) {
          update.$set[pathName] = defaultValue;
        } else {
          update[pathName] = defaultValue;
        }
      }
    });
  };

  // Attach lifecycle pre-save pipeline event hooks
  schema.pre("save", async function () {
    applyDefaultsToDocument(this);
  });

  // Attach lifecycle pre-findOneAndUpdate pipeline event hooks
  schema.pre("findOneAndUpdate", async function () {
    const update: any = this.getUpdate();
    if (update) {
      applyDefaultsToUpdate(update);
    }
  });
};
