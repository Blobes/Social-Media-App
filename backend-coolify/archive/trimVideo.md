import ffmpeg from "fluent-ffmpeg";
import path from "path";
import fs from "fs";

/**
 * Trims heavy video content down to a 5-second slice to minimize downstream token costs.
 */
export const trimVideoAsset = async (
  sourceUrl: string,
  fileKey: string,
): Promise<string> => {
  const outputDirectory = path.join(__dirname, "../tmp");

  // Ensure the temporary directory layout exists safely
  if (!fs.existsSync(outputDirectory)) {
    fs.mkdirSync(outputDirectory, { recursive: true });
  }

  // Sanitize the file key to prevent directory traversal vulnerabilities
  const sanitizedKey = path.basename(fileKey);
  const outputFilePath = path.join(
    outputDirectory,
    `trimmed_${sanitizedKey}.mp4`,
  );

  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(sourceUrl)
      // Force native input format protocols over network configurations
      .inputOptions([
        "-reconnect 1",
        "-reconnect_streamed 1",
        "-reconnect_delay_max 5",
      ])
      .setStartTime(0)
      .setDuration(5) // Strict 5-second boundary to optimize worker costs
      .videoCodec("libx264") // Enforce web-compatible codec mapping explicitly
      .audioCodec("aac")
      .output(outputFilePath)
      .on("end", () => {
        resolve(outputFilePath);
      })
      .on("error", (err) => {
        // Clean up partial corrupted files if processing drops mid-stream
        if (fs.existsSync(outputFilePath)) {
          fs.unlinkSync(outputFilePath);
        }
        reject(new Error(`Ffmpeg trimming pipeline failure: ${err.message}`));
      })
      .run();
  });
};
