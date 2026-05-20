package tasks

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

type NodeClient struct {
	Endpoint   string
	HTTPClient *http.Client
}

// NewNodeClient builds a reusable HTTP client for post-finalization callbacks.
func NewNodeClient(endpoint string) *NodeClient {
	return &NodeClient{
		Endpoint: endpoint,
		HTTPClient: &http.Client{
			Timeout: 15 * time.Second,
			Transport: &http.Transport{
				MaxIdleConns:        100,
				MaxIdleConnsPerHost: 20,
				IdleConnTimeout:     90 * time.Second,
			},
		},
	}
}

// DispatchFinalization sends the final moderation payload to the Node service.
func (nc *NodeClient) DispatchFinalization(ctx context.Context, payload *NodeCallbackPayload) error {
	callbackBytes, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("failed to marshal finalization payload: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, nc.Endpoint, bytes.NewBuffer(callbackBytes))
	if err != nil {
		return fmt.Errorf("failed to construct HTTP request context: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := nc.HTTPClient.Do(req)
	if err != nil {
		return fmt.Errorf("network execution failure on finalization bridge callback: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("node engine transaction mutation state failed with response code: %d", resp.StatusCode)
	}

	return nil
}
