import { Schema, SchemaType } from "mongoose";

/**
 * Applies schema defaults on insert only.
 * Existing documents and partial updates must not receive omitted-path defaults.
 */
export const schemaSyncPlugin = (schema: Schema) => {
  const resolveDefault = (schemaType: SchemaType, scope?: unknown) => {
    const def = schemaType.options.default;
    if (typeof def === "function") {
      return (def as (this: unknown) => unknown).call(scope);
    }
    return def;
  };

  const applyDefaultsToDocument = (doc: {
    isNew?: boolean;
    get(path: string): unknown;
    set(path: string, val: unknown): unknown;
  }) => {
    if (!doc.isNew) return;

    schema.eachPath((pathName, schemaType: SchemaType) => {
      if (pathName === "_id" || pathName === "__v") return;
      if (
        !Object.prototype.hasOwnProperty.call(schemaType.options, "default")
      ) {
        return;
      }

      const current = doc.get(pathName);
      if (current !== undefined) return;

      doc.set(pathName, resolveDefault(schemaType, doc));
    });
  };

  schema.pre("save", function () {
    applyDefaultsToDocument(this);
  });

  schema.pre("findOneAndUpdate", function () {
    const options = this.getOptions();
    if (!options.upsert) return;

    const update = this.getUpdate() as Record<string, unknown> | null;
    if (!update) return;

    const setOnInsert =
      (update.$setOnInsert as Record<string, unknown> | undefined) ?? {};
    const set = update.$set as Record<string, unknown> | undefined;

    schema.eachPath((pathName, schemaType: SchemaType) => {
      if (pathName === "_id" || pathName === "__v") return;
      if (
        !Object.prototype.hasOwnProperty.call(schemaType.options, "default")
      ) {
        return;
      }

      const inSet = Boolean(
        set && Object.prototype.hasOwnProperty.call(set, pathName),
      );
      const inUpdate = Object.prototype.hasOwnProperty.call(update, pathName);
      const inSetOnInsert = Object.prototype.hasOwnProperty.call(
        setOnInsert,
        pathName,
      );

      if (inSet || inUpdate || inSetOnInsert) return;

      setOnInsert[pathName] = resolveDefault(schemaType);
    });

    update.$setOnInsert = setOnInsert;
    this.setUpdate(update);
  });
};
