import { Model, PopulateOptions } from "mongoose";

interface SoftDeleteOptions {
  model: Model<any>;
  id: string;
  field: string;
  populateFields?: string[] | PopulateOptions[];
}

/**
 * Utility to perform a soft delete:
 * It nullifies the reference to a media object without deleting
 * the actual Media record or S3 file.
 */
export const softDeleteMedia = async ({
  model,
  id,
  field,
  populateFields = [],
}: SoftDeleteOptions) => {
  const updatedDoc = await model
    .findByIdAndUpdate(
      id,
      { $set: { [field]: null } },
      {
        new: true,
        runValidators: true,
      },
    )
    .populate(populateFields);

  return updatedDoc;
};
