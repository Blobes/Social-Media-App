package tasks

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"image"
	_ "image/jpeg"
	_ "image/png"
	"log"
	"os"
	"os/exec"
	"path/filepath"
	"strings"

	"github.com/chai2010/webp"
	"github.com/hibiken/asynq"
)

/**
 * Executes media processing pipelines for videos (HLS transcoding + posters)
 * and WebP optimization for images, optionally purging the raw source asset if requested.
 */
func (deps *DependencyContext) ProcessMediaItem(ctx context.Context, media MediaInput, purgeRawSource ...bool) (ProcessedMedia, error) {
	shouldPurge := false
	if len(purgeRawSource) > 0 {
		shouldPurge = purgeRawSource[0]
	}

	result := ProcessedMedia{MediaInput: media}

	tmpFile, err := DownloadTemporaryAsset(ctx, media.URL)
	if err != nil {
		return result, fmt.Errorf("failed downloading target asset: %w", err)
	}
	defer os.Remove(tmpFile)

	if strings.HasPrefix(media.Type, "VIDEO") || (media.MimeType != nil && strings.HasPrefix(*media.MimeType, "video/")) {
		processedVideo, err := deps.processVideoHLS(ctx, tmpFile, media)
		if err != nil {
			return result, err
		}

		if shouldPurge {
			if err := deps.StorageClient.DeleteObject(ctx, media.FileKey); err != nil {
				log.Printf("⚠️ Failed to purge raw video source asset [%s] from cloud: %v", media.FileKey, err)
			} else {
				log.Printf("🗑️ Purged raw video source asset [%s] from cloud storage", media.FileKey)
			}
		}

		return processedVideo, nil
	}

	if strings.HasPrefix(media.Type, "IMAGE") || (media.MimeType != nil && strings.HasPrefix(*media.MimeType, "image/")) {
		if media.MimeType != nil && *media.MimeType == "image/webp" {
			return result, nil
		}

		processedKey, err := deps.processImageToWebP(ctx, tmpFile, media.FileKey)
		if err != nil {
			return result, fmt.Errorf("fallback webp image optimization failed: %w", err)
		}

		if shouldPurge {
			if err := deps.StorageClient.DeleteObject(ctx, media.FileKey); err != nil {
				log.Printf("⚠️ Failed to purge raw image source asset [%s] from cloud: %v", media.FileKey, err)
			} else {
				log.Printf("🗑️ Purged raw image source asset [%s] from cloud storage", media.FileKey)
			}
		}

		result.URL = fmt.Sprintf("%s/%s", deps.StorageClient.bucketName, processedKey)
		result.FileKey = processedKey
		mime := "image/webp"
		result.MimeType = &mime
		return result, nil
	}

	return result, nil
}

/**
 * Converts raw image buffers into lossy WebP format and uploads to storage.
 */
func (deps *DependencyContext) processImageToWebP(ctx context.Context, inputPath string, originalKey string) (string, error) {
	file, err := os.Open(inputPath)
	if err != nil {
		return "", err
	}
	defer file.Close()

	img, _, err := image.Decode(file)
	if err != nil {
		return "", err
	}

	var webpBuf bytes.Buffer
	if err := webp.Encode(&webpBuf, img, &webp.Options{Lossless: false, Quality: 80}); err != nil {
		return "", err
	}

	targetKey := strings.TrimSuffix(originalKey, filepath.Ext(originalKey)) + ".webp"
	_, err = deps.StorageClient.UploadBytes(ctx, webpBuf.Bytes(), targetKey)
	if err != nil {
		return "", err
	}

	return targetKey, nil
}

/**
 * Runs multi-bitrate HLS adaptive video transcoding and poster frame extraction using FFmpeg.
 */
func (deps *DependencyContext) processVideoHLS(ctx context.Context, inputPath string, media MediaInput) (ProcessedMedia, error) {
	result := ProcessedMedia{MediaInput: media}
	workDir, err := os.MkdirTemp("", "hls-proc-*")
	if err != nil {
		return result, err
	}
	defer os.RemoveAll(workDir)

	posterPath := filepath.Join(workDir, "poster.jpg")
	posterCmd := exec.CommandContext(ctx, "ffmpeg", "-ss", "00:00:01", "-i", inputPath, "-vframes", "1", "-q:v", "2", posterPath)
	_ = posterCmd.Run()

	if posterData, err := os.ReadFile(posterPath); err == nil {
		posterKey := strings.TrimSuffix(media.FileKey, filepath.Ext(media.FileKey)) + "_poster.jpg"
		if posterURL, err := deps.StorageClient.UploadBytes(ctx, posterData, posterKey); err == nil {
			result.ThumbnailURL = &posterURL
		}
	}

	hlsOutputDir := filepath.Join(workDir, "hls")
	_ = os.MkdirAll(hlsOutputDir, 0755)

	ffmpegArgs := []string{
		"-i", inputPath,
		"-filter_complex", "[0:v]split=4[v1],[v2],[v3],[v4]; [v1]scale=w=1920:h=1080:force_original_aspect_ratio=decrease[v1out]; [v2]scale=w=1280:h=720:force_original_aspect_ratio=decrease[v2out]; [v3]scale=w=854:h=480:force_original_aspect_ratio=decrease[v3out]; [v4]scale=w=640:h=360:force_original_aspect_ratio=decrease[v4out]",
		"-map", "[v1out]", "-c:v:0", "libx264", "-b:v:0", "5000k", "-maxrate:v:0", "5350k", "-bufsize:v:0", "7500k",
		"-map", "[v2out]", "-c:v:1", "libx264", "-b:v:1", "2800k", "-maxrate:v:1", "2996k", "-bufsize:v:1", "4200k",
		"-map", "[v3out]", "-c:v:2", "libx264", "-b:v:2", "1400k", "-maxrate:v:2", "1498k", "-bufsize:v:2", "2100k",
		"-map", "[v4out]", "-c:v:3", "libx264", "-b:v:3", "800k", "-maxrate:v:3", "856k", "-bufsize:v:3", "1200k",
		"-map", "a:0?", "-c:a", "aac", "-b:a", "128k",
		"-map", "a:0?", "-c:a", "aac", "-b:a", "128k",
		"-map", "a:0?", "-c:a", "aac", "-b:a", "96k",
		"-map", "a:0?", "-c:a", "aac", "-b:a", "64k",
		"-f", "hls",
		"-hls_time", "6",
		"-hls_playlist_type", "vod",
		"-hls_flags", "independent_segments",
		"-hls_segment_filename", filepath.Join(hlsOutputDir, "stream_%v_%03d.ts"),
		"-master_pl_name", "master.m3u8",
		filepath.Join(hlsOutputDir, "stream_%v.m3u8"),
	}

	cmd := exec.CommandContext(ctx, "ffmpeg", ffmpegArgs...)
	if err := cmd.Run(); err != nil {
		return result, fmt.Errorf("ffmpeg multi-bitrate transcode pipeline failed: %w", err)
	}

	basePrefix := strings.TrimSuffix(media.FileKey, filepath.Ext(media.FileKey)) + "/hls"
	err = filepath.Walk(hlsOutputDir, func(path string, info os.FileInfo, err error) error {
		if err != nil || info.IsDir() {
			return err
		}
		relPath, _ := filepath.Rel(hlsOutputDir, path)
		targetKey := fmt.Sprintf("%s/%s", basePrefix, relPath)
		data, err := os.ReadFile(path)
		if err != nil {
			return err
		}
		uploadedURL, err := deps.StorageClient.UploadBytes(ctx, data, targetKey)
		if err != nil {
			return err
		}
		if relPath == "master.m3u8" {
			result.HLSUrl = &uploadedURL
		}
		return nil
	})

	if err != nil {
		return result, fmt.Errorf("failed committing HLS segment structure to storage: %w", err)
	}

	return result, nil
}

/**
 * Asynq task handler for standalone media processing workflows across all application features.
 */
func (deps *DependencyContext) HandleMediaProcessing(ctx context.Context, t *asynq.Task) error {
	var payload ProcessMediaTaskPayload
	if err := json.Unmarshal(t.Payload(), &payload); err != nil {
		return fmt.Errorf("media payload ingestion failure: %w", err)
	}

	log.Printf("📥 Executing standalone media optimization job for target: %s (Asset Count: %d, Purge Raw: %t)",
		payload.TargetID, len(payload.Media), payload.PurgeRawSource)

	var processedMediaList []MediaInput
	for _, mediaItem := range payload.Media {
		processed, err := deps.ProcessMediaItem(ctx, mediaItem, payload.PurgeRawSource)
		if err != nil {
			log.Printf("⚠️ Non-blocking media conversion error on asset %s: %v", mediaItem.FileKey, err)
			processedMediaList = append(processedMediaList, mediaItem)
			continue
		}
		processedMediaList = append(processedMediaList, processed.MediaInput)
	}

	log.Printf("✅ Successfully finished processing standalone media assets for target: %s", payload.TargetID)
	return nil
}
