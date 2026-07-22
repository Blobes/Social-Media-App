import mongoose, { Model, Schema, SchemaType } from "mongoose";

/**
 * Interface representing a field rename rule.
 */
export interface FieldRenameConfig {
  oldName: string;
  newName: string;
}

/**
 * Interface for all database migration instances.
 */
export interface Migration {
  readonly name: string;
  up(): Promise<void>;
}

/**
 * Manages database migration execution lifecycle.
 */
export class MigrationRunner {
  private migrations: Migration[];
  private dbUri: string;

  /**
   * Initializes the migration runner with database URI and migration list.
   */
  constructor(dbUri: string, migrations: Migration[]) {
    this.dbUri = dbUri;
    this.migrations = migrations;
  }

  /**
   * Runs configured migrations sequentially.
   */
  public async run(): Promise<void> {
    console.log("Starting database migrations...");

    try {
      await mongoose.connect(this.dbUri);
      console.log("Database connected successfully for migrations.");

      for (const migration of this.migrations) {
        console.log(`Running migration: ${migration.name}...`);
        try {
          await migration.up();
          console.log(`Migration "${migration.name}" completed successfully.`);
        } catch (error) {
          console.error(`Migration "${migration.name}" failed:`, error);
          throw error;
        }
      }

      console.log("All migrations finished.");
    } catch (error) {
      console.error("Migration runner encountered a critical error:", error);
      process.exit(1);
    } finally {
      await mongoose.disconnect();
      console.log("Database disconnected.");
      process.exit(0);
    }
  }
}

/**
 * Removes deprecated fields from collection documents.
 */
export class UnsetOldDBFields implements Migration {
  readonly name: string;
  private model: Model<any>;
  private fieldsToUnset: string[];

  /**
   * Initializes field unsetting rule configuration.
   */
  constructor(
    model: Model<any>,
    fieldsToUnset: string[],
    migrationName?: string,
  ) {
    if (!model) {
      throw new Error("Mongoose model is required for UnsetOldDBFields.");
    }
    if (!fieldsToUnset || fieldsToUnset.length === 0) {
      throw new Error("Fields to unset must be provided for UnsetOldDBFields.");
    }

    this.model = model;
    this.fieldsToUnset = fieldsToUnset;
    this.name =
      migrationName ||
      `UnsetOldFields_${model.modelName}_${fieldsToUnset.join("_")}_${Date.now()}`;
  }

  /**
   * Executes $unset query for specified target fields.
   */
  async up(): Promise<void> {
    const unsetObject: Record<string, ""> = {};
    this.fieldsToUnset.forEach((field) => {
      unsetObject[field] = "";
    });

    console.log(
      `  - Unsetting fields [${this.fieldsToUnset.join(", ")}] from ${this.model.modelName} collection...`,
    );

    const result = await this.model.collection.updateMany(
      {
        $or: this.fieldsToUnset.map((field) => ({
          [field]: { $exists: true },
        })),
      },
      {
        $unset: unsetObject,
      },
    );

    console.log(
      `  - Unset operation completed for ${this.model.modelName}: ${result.matchedCount} documents matched, ${result.modifiedCount} modified.`,
    );
  }
}

/**
 * Automatically synchronizes a Mongoose model's schema defaults, field renames, data retention archiving, and deprecated fields with MongoDB.
 */
export class AutoSyncSchemaFields implements Migration {
  readonly name: string;
  private model: Model<any>;
  private schema: Schema;
  private options: {
    sampleSize: number;
    excludeFieldsFromUnset: string[];
    renameFields: FieldRenameConfig[];
    archiveBeforeUnset: boolean;
    archiveSuffix: string;
  };

  /**
   * Configures automatic schema synchronization options and parameters.
   */
  constructor(
    model: Model<any>,
    options?: {
      sampleSize?: number;
      excludeFieldsFromUnset?: string[];
      renameFields?: FieldRenameConfig[];
      archiveBeforeUnset?: boolean;
      archiveSuffix?: string;
    },
    migrationName?: string,
  ) {
    if (!model) {
      throw new Error("Mongoose model is required for AutoSyncSchemaFields.");
    }

    this.model = model;
    this.schema = model.schema;
    this.options = {
      sampleSize: options?.sampleSize || 1000,
      excludeFieldsFromUnset: options?.excludeFieldsFromUnset || [
        "_id",
        "__v",
        "createdAt",
        "updatedAt",
        "id",
      ],
      renameFields: options?.renameFields || [],
      archiveBeforeUnset: options?.archiveBeforeUnset ?? true,
      archiveSuffix: options?.archiveSuffix || "_archived_fields",
    };
    this.name =
      migrationName || `AutoSchemaSync_${model.modelName}_${Date.now()}`;
  }

  /**
   * Performs schema alignment operations sequentially.
   */
  async up(): Promise<void> {
    console.log(
      `  - Running auto-schema sync for model: ${this.model.modelName}`,
    );

    await this.renameOldFields();
    await this.removeDeprecatedFields();
    await this.addMissingFields();

    console.log(
      `  - Auto-schema sync completed for model: ${this.model.modelName}`,
    );
  }

  /**
   * Renames field keys across collection documents while maintaining existing values.
   */
  private async renameOldFields(): Promise<void> {
    if (this.options.renameFields.length === 0) {
      return;
    }

    for (const { oldName, newName } of this.options.renameFields) {
      console.log(
        `    - Renaming field "${oldName}" to "${newName}" in ${this.model.modelName} collection...`,
      );

      const result = await this.model.collection.updateMany(
        { [oldName]: { $exists: true } },
        { $rename: { [oldName]: newName } },
      );

      if (result.modifiedCount > 0) {
        console.log(
          `    - Renamed field "${oldName}" to "${newName}" on ${result.modifiedCount} documents in ${this.model.modelName}.`,
        );
      } else {
        console.log(
          `    - No documents found with old field "${oldName}" in ${this.model.modelName}.`,
        );
      }
    }
  }

  /**
   * Evaluates missing schema default paths independently per field.
   */
  private async addMissingFields(): Promise<void> {
    const schemaFieldsWithDefaults: string[] = [];

    this.schema.eachPath((pathName, schemaType: SchemaType) => {
      if (
        schemaType.options &&
        Object.prototype.hasOwnProperty.call(schemaType.options, "default") &&
        !pathName.startsWith("_") &&
        pathName !== "__v" &&
        pathName !== "id"
      ) {
        schemaFieldsWithDefaults.push(pathName);
      }
    });

    if (schemaFieldsWithDefaults.length === 0) {
      console.log(
        `    - No new fields with defaults detected in schema for ${this.model.modelName}. Skipping default setting.`,
      );
      return;
    }

    for (const field of schemaFieldsWithDefaults) {
      const fieldSchemaType = this.schema.path(field) as SchemaType;
      let defaultValue = fieldSchemaType.options.default;

      if (typeof defaultValue === "function") {
        defaultValue = defaultValue();
      }

      const result = await this.model.collection.updateMany(
        { [field]: { $exists: false } },
        { $set: { [field]: defaultValue } },
      );

      if (result.modifiedCount > 0) {
        console.log(
          `    - Set missing field "${field}" on ${result.modifiedCount} documents in ${this.model.modelName}.`,
        );
      }
    }
  }

  /**
   * Archives values of fields marked for unsetting into a retention collection.
   */
  private async archiveFields(fieldsToArchive: string[]): Promise<void> {
    const archiveCollectionName = `${this.model.collection.name}${this.options.archiveSuffix}`;
    const db = mongoose.connection.db;

    if (!db) {
      throw new Error("Database connection is not active for data archiving.");
    }

    const archiveCollection = db.collection(archiveCollectionName);

    const projection: Record<string, number> = { _id: 1 };
    fieldsToArchive.forEach((field) => {
      projection[field] = 1;
    });

    const matchQuery = {
      $or: fieldsToArchive.map((field) => ({ [field]: { $exists: true } })),
    };

    const documentsToArchive = await this.model.collection
      .find(matchQuery, { projection })
      .toArray();

    if (documentsToArchive.length === 0) {
      return;
    }

    const archivePayloads = documentsToArchive.map((doc) => ({
      originalDocumentId: doc._id,
      archivedAt: new Date(),
      collectionName: this.model.collection.name,
      deprecatedData: doc,
    }));

    await archiveCollection.insertMany(archivePayloads);

    console.log(
      `    - Retained data: Archived ${archivePayloads.length} record snapshots to "${archiveCollectionName}".`,
    );
  }

  /**
   * Recursively builds all possible valid prefixes for multi-level nested fields.
   */
  private extractAllParentPaths(
    pathName: string,
    schemaFieldNames: Set<string>,
  ): void {
    const parts = pathName.split(".");
    let currentPath = "";

    for (let i = 0; i < parts.length; i++) {
      currentPath = currentPath ? `${currentPath}.${parts[i]}` : parts[i];
      schemaFieldNames.add(currentPath);
    }
  }

  /**
   * Scans existing documents to archive and unset unmapped schema paths across all nesting depths.
   */
  private async removeDeprecatedFields(): Promise<void> {
    const schemaFieldNames = new Set<string>();

    this.schema.eachPath((pathName) => {
      this.extractAllParentPaths(pathName, schemaFieldNames);
    });

    Object.keys(this.schema.virtuals).forEach((v) => {
      this.extractAllParentPaths(v, schemaFieldNames);
    });

    // Extract top-level keys across collection documents
    const dbFieldNamesList: string[] = await this.model.collection
      .aggregate([
        { $project: { arrayofkeyvalue: { $objectToArray: "$$ROOT" } } },
        { $unwind: "$arrayofkeyvalue" },
        { $group: { _id: null, allkeys: { $addToSet: "$arrayofkeyvalue.k" } } },
      ])
      .toArray()
      .then((res) => (res.length > 0 ? res[0].allkeys : []));

    const dbFieldNames = new Set<string>(dbFieldNamesList);

    if (dbFieldNames.size === 0) {
      console.log(
        `    - No document keys detected in ${this.model.modelName} collection. Skipping deprecated field removal.`,
      );
      return;
    }

    const oldRenamedFieldNames = this.options.renameFields.map(
      (r) => r.oldName,
    );
    const ignoredFields = [
      ...this.options.excludeFieldsFromUnset,
      ...oldRenamedFieldNames,
    ];

    const fieldsToUnset: string[] = [];
    for (const dbField of dbFieldNames) {
      if (!schemaFieldNames.has(dbField) && !ignoredFields.includes(dbField)) {
        fieldsToUnset.push(dbField);
      }
    }

    if (fieldsToUnset.length === 0) {
      console.log(
        `    - No deprecated fields detected in ${this.model.modelName} collection. Skipping unset operation.`,
      );
      return;
    }

    if (this.options.archiveBeforeUnset) {
      await this.archiveFields(fieldsToUnset);
    }

    const unsetObject: Record<string, ""> = {};
    fieldsToUnset.forEach((field) => {
      unsetObject[field] = "";
    });

    console.log(
      `    - Detected deprecated fields across all documents: [${fieldsToUnset.join(", ")}]. Unsetting from ${this.model.modelName} collection...`,
    );

    const result = await this.model.collection.updateMany(
      { $or: fieldsToUnset.map((field) => ({ [field]: { $exists: true } })) },
      { $unset: unsetObject },
    );

    console.log(
      `    - Deprecated field removal completed for ${this.model.modelName}: ${result.matchedCount} documents matched, ${result.modifiedCount} modified.`,
    );
  }
}
