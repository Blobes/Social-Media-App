package tasks

import (
	"crypto/rand"
	"log"
	"math/big"
)

/* Partitions a media collection into balanced subgroups and randomly selects up to 3 files per group.
 */
func sampleMediaGroups(media []MediaInput, groupSize int, maxPerGroup int) []MediaInput {
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
