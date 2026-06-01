importScripts("https://unpkg.com/@ffmpeg/ffmpeg@0.12.10/dist/ffmpeg.min.js");
importScripts("https://unpkg.com/@ffmpeg/util@0.12.0/dist/index.min.js");

const { FFmpeg } = createFFmpegMain;
const { fetchFile } = createFFmpegUtil;

let ffmpegInstance = null;

/**
 * Initializes the webassembly binary package context.
 */
async function loadFFmpegEngine() {
  if (ffmpegInstance) return ffmpegInstance;

  ffmpegInstance = new FFmpeg();
  await ffmpegInstance.load({
    coreURL: "https://unpkg.com/@ffmpeg/core@0.12.10/dist/esm/ffmpeg-core.js",
    wasmURL: "https://unpkg.com/@ffmpeg/core@0.12.10/dist/esm/ffmpeg-core.wasm",
  });

  return ffmpegInstance;
}

self.onmessage = async (event) => {
  const { file, action, id } = event.data;

  if (action === "COMPRESS_VIDEO") {
    try {
      // Emit initial boot phase update state
      self.postMessage({
        action: "PROGRESS",
        id,
        status: "LOADING_ENGINE",
        progress: 0,
      });

      const ffmpeg = await loadFFmpegEngine();

      // Monitor structural progress events fired by the underlying container
      ffmpeg.on("progress", ({ progress }) => {
        self.postMessage({
          action: "PROGRESS",
          id,
          status: "PROCESSING",
          progress: Math.round(progress * 100),
        });
      });

      const inputName = `input_${id}.mp4`;
      const outputName = `output_${id}.mp4`;

      await ffmpeg.writeFile(inputName, await fetchFile(file));

      // Execute targeted H.264 compression via standard terminal arguments
      await ffmpeg.exec([
        "-i",
        inputName,
        "-vcodec",
        "libx264",
        "-crf",
        "28",
        "-preset",
        "ultrafast",
        outputName,
      ]);

      const compressedData = await ffmpeg.readFile(outputName);
      const compressedBlob = new Blob([compressedData.buffer], {
        type: "video/mp4",
      });

      // Signal completion with final tracking stats included
      self.postMessage({
        action: "SUCCESS",
        id,
        status: "SUCCESS",
        blob: compressedBlob,
        originalSize: file.size,
        compressedSize: compressedBlob.size,
      });

      // Erase virtual disk spaces instantly to prevent memory leaks in the browser tab
      await ffmpeg.deleteFile(inputName);
      await ffmpeg.deleteFile(outputName);
    } catch (error) {
      self.postMessage({
        action: "ERROR",
        id,
        status: "ERROR",
        error: error.message,
      });
    }
  }
};
