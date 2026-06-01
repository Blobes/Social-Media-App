package tasks

import (
	"bytes"
	"context"
	"fmt"
	"net/http"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

type StorageClient struct {
	s3Client   *s3.Client
	bucketName string
}

/**
 * Initializes a standard S3 asset storage client instance using explicit cloud storage platform key variables.
 */
func NewStorageClient(ctx context.Context, bucket, region, accessKey, secretKey string) (*StorageClient, error) {
	credProvider := credentials.NewStaticCredentialsProvider(accessKey, secretKey, "")

	cfg, err := config.LoadDefaultConfig(ctx,
		config.WithRegion(region),
		config.WithCredentialsProvider(credProvider),
	)
	if err != nil {
		return nil, fmt.Errorf("failed to load s3 storage config context payload: %w", err)
	}

	return &StorageClient{
		s3Client:   s3.NewFromConfig(cfg),
		bucketName: bucket,
	}, nil
}

/**
 * Uploads raw binary payloads directly to the target object container without local filesystem writes.
 */
func (sc *StorageClient) UploadBytes(ctx context.Context, fileBytes []byte, targetKey string) (string, error) {
	if len(fileBytes) == 0 {
		return "", fmt.Errorf("cannot process an empty object stream layout payload")
	}

	contentType := http.DetectContentType(fileBytes)
	if contentType == "application/octet-stream" && (len(targetKey) > 4 && targetKey[len(targetKey)-4:] == ".jpg") {
		contentType = "image/jpeg"
	}

	bodyReader := bytes.NewReader(fileBytes)

	_, err := sc.s3Client.PutObject(ctx, &s3.PutObjectInput{
		Bucket:      aws.String(sc.bucketName),
		Key:         aws.String(targetKey),
		Body:        bodyReader,
		ContentType: aws.String(contentType),
	})
	if err != nil {
		return "", fmt.Errorf("failed pushing data sequence stream to storage gateway target: %w", err)
	}

	return fmt.Sprintf("https://%s.s3.%s.amazonaws.com/%s", sc.bucketName, sc.s3Client.Options().Region, targetKey), nil
}

/**
 * Removes an explicitly targeted object entry from your S3 bucket using its object tracking key identifier.
 */
func (sc *StorageClient) DeleteObject(ctx context.Context, targetKey string) error {
	_, err := sc.s3Client.DeleteObject(ctx, &s3.DeleteObjectInput{
		Bucket: aws.String(sc.bucketName),
		Key:    aws.String(targetKey),
	})
	if err != nil {
		return fmt.Errorf("failed executing s3 object elimination lifecycle call: %w", err)
	}
	return nil
}
