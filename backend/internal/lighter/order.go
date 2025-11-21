// internal/lighter/orders.go
package internal

import (
    "context"
    "encoding/json"
    "fmt"
    "net/http"
)


type PlaceOrderRequest struct {
    // shape that Lighter / underlying CEX expects
}

type PlaceOrderResponse struct {
    // real exchange response fields
}

func (c *LighterClient) PlaceOrder(ctx context.Context, payload PlaceOrderRequest) (*PlaceOrderResponse, error) {
    raw, err := c.doJSON(ctx, http.MethodPost, "/api/v1/orders", nil /* query */)
    if err != nil {
        return nil, err
    }

    var resp PlaceOrderResponse
    if err := json.Unmarshal(raw, &resp); err != nil {
        return nil, fmt.Errorf("decode place order: %w", err)
    }
    return &resp, nil
}