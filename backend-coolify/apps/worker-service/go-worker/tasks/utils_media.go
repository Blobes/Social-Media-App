package tasks

import (
	"crypto/rand"

	"log"
	"math/big"

	"bytes"
	"context"
	"fmt"
	"image"
	"image/draw"
	"image/jpeg"
	_ "image/jpeg" // Register JPEG decoder drivers
	"math"
	"os/exec"
)

/* Partitions a media collection into balanced subgroups and randomly selects up to 3 files per group.
 */
func SampleMediaGroups(media []MediaInput, groupSize int, maxPerGroup int) []MediaInput {
	totalItems := len(media)
	if totalItems == 0 {
		return media
	}

	var sampledResult []MediaInput

	// Group sequentially into segments of size 'groupSize'
	for i := 0; i < totalItems; i += groupSize {
		end := i + groupSize
		if end > totalItems {
			end = totalItems
		}

		currentGroup := media[i:end]
		groupLength := len(currentGroup)

		if groupLength <= maxPerGroup {
			// Take the whole group if it is smaller than or equal to our threshold capacity
			sampledResult = append(sampledResult, currentGroup...)
		} else {
			// Perform cryptographic pseudorandom sampling on the index array layout
			chosenIndices := make(map[int]bool)
			for len(chosenIndices) < maxPerGroup {
				nBig, err := rand.Int(rand.Reader, big.NewInt(int64(groupLength)))
				if err != nil {
					// Fallback to progressive scanning if crypto entropy blocks
					log.Printf("⚠️ Crypto fallback engaged during indexing sweep: %v", err)
					break
				}
				chosenIndices[int(nBig.Int64())] = true
			}

			// Append chosen media assets to the final validation stream array
			for idx := range chosenIndices {
				sampledResult = append(sampledResult, currentGroup[idx])
			}
		}
	}

	return sampledResult
}

/* Computes 24 staggered timestamps distributed evenly across the absolute duration.
 */
func DetermineVideoProbePoints(duration float64) []float64 {
	var targets []float64
	numGroups := 6
	framesPerGroup := 4
	totalFrames := numGroups * framesPerGroup // 24 frames total

	// Stagger step sizing mapped across the entire video bounds
	intervalStride := duration / float64(totalFrames)

	for i := 0; i < totalFrames; i++ {
		targetTime := float64(i) * intervalStride

		// Guardrail: offset slightly from the absolute end boundaries to prevent empty frame reads
		if targetTime >= duration {
			targetTime = duration - 0.2
		}
		if targetTime < 0 {
			targetTime = 0
		}
		targets = append(targets, targetTime)
	}
	return targets
}

/* Extracts individual high-resolution frame buffers utilizing high-speed input streams.
 */
func ExtractDistributedFrames(ctx context.Context, videoPath string, timestamps []float64, duration float64) ([][]byte, error) {
	var extractedFrames [][]byte

	// Switch strategy based on length to guarantee distinct frames on shorter assets
	isShortVideo := duration < 60.0

	for _, ts := range timestamps {
		var args []string

		if isShortVideo {
			// Slow-seeking format: Accurate frame decoding at exact timestamps for shorter clips
			args = []string{
				"-i", videoPath,
				"-ss", fmt.Sprintf("%f", ts),
				"-vframes", "1",
				"-q:v", "2",
				"-f", "image2pipe",
				"-vcodec", "mjpeg",
				"pipe:1",
			}
		} else {
			// Fast-seeking format: Container matrix seek for top processing speeds on long assets
			args = []string{
				"-ss", fmt.Sprintf("%f", ts),
				"-i", videoPath,
				"-vframes", "1",
				"-q:v", "2",
				"-f", "image2pipe",
				"-vcodec", "mjpeg",
				"pipe:1",
			}
		}

		cmd := exec.CommandContext(ctx, "ffmpeg", args...)

		var stdoutBuf bytes.Buffer
		var stderrBuf bytes.Buffer
		cmd.Stdout = &stdoutBuf
		cmd.Stderr = &stderrBuf

		if err := cmd.Run(); err != nil {
			// Non-blocking fallback: if a single seek fails due to file corruption at that second, skip it
			continue
		}

		frameData := stdoutBuf.Bytes()
		if len(frameData) > 0 {
			extractedFrames = append(extractedFrames, frameData)
		}
	}

	if len(extractedFrames) == 0 {
		return nil, fmt.Errorf("failed to extract any valid frame segments from target video stream asset")
	}

	return extractedFrames, nil
}

/* Combines independent image frame slices into a clean 4x6 composite montage sheet.
 */
func BuildVideoMontageMatrix(frames [][]byte) ([][]byte, error) {
	var decodedImages []image.Image

	for _, f := range frames {
		img, _, err := image.Decode(bytes.NewReader(f))
		if err != nil {
			continue
		}
		decodedImages = append(decodedImages, img)
	}

	totalImages := len(decodedImages)
	if totalImages == 0 {
		return nil, fmt.Errorf("no valid images could be processed into the canvas matrix layer")
	}

	baseWidth := decodedImages[0].Bounds().Dx()
	baseHeight := decodedImages[0].Bounds().Dy()

	// Splitting 24 frames across 2 sheets gives a maximum of 12 frames per sheet.
	// A 3x4 grid offers larger grid cells than a tight 4x6 layout.
	cols := 3
	framesPerSheet := 12

	var sheetsBytes [][]byte

	for startIdx := 0; startIdx < totalImages; startIdx += framesPerSheet {
		endIdx := startIdx + framesPerSheet
		if endIdx > totalImages {
			endIdx = totalImages
		}

		sheetImages := decodedImages[startIdx:endIdx]
		sheetLength := len(sheetImages)

		rows := int(math.Ceil(float64(sheetLength) / float64(cols)))
		canvasWidth := baseWidth * cols
		canvasHeight := baseHeight * rows

		montageCanvas := image.NewRGBA(image.Rect(0, 0, canvasWidth, canvasHeight))

		for index, img := range sheetImages {
			col := index % cols
			row := index / cols

			xOffset := col * baseWidth
			yOffset := row * baseHeight

			drawRect := image.Rect(xOffset, yOffset, xOffset+baseWidth, yOffset+baseHeight)
			draw.Draw(montageCanvas, drawRect, img, image.Point{}, draw.Src)
		}

		var outputBuffer bytes.Buffer
		err := jpeg.Encode(&outputBuffer, montageCanvas, &jpeg.Options{Quality: 82})
		if err != nil {
			return nil, fmt.Errorf("failed to write sheet output buffer data: %w", err)
		}

		sheetsBytes = append(sheetsBytes, outputBuffer.Bytes())
	}

	return sheetsBytes, nil
}
