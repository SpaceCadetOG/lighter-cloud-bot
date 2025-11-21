// backend/internal/lighter/client_rest.go
package internal

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"time"
)

// LighterClient is a simple REST client for Lighter public APIs.
type LighterClient struct {
	baseURL string
	http    *http.Client
}

// NewLighterClientFromEnv builds a client using LIGHTER_BASE_URL, or mainnet default.
func NewLighterClientFromEnv() *LighterClient {
	base := os.Getenv("LIGHTER_BASE_URL")
	if base == "" {
		base = "https://mainnet.zklighter.elliot.ai"
	}

	return &LighterClient{
		baseURL: base,
		http: &http.Client{
			Timeout: 5 * time.Second,
		},
	}
}

// doJSON is a small helper to GET/POST a path and decode as json.RawMessage.
func (c *LighterClient) doJSON(
	ctx context.Context,
	method string,
	path string,
	query map[string]string,
) (json.RawMessage, error) {
	req, err := http.NewRequestWithContext(ctx, method, c.baseURL+path, nil)
	if err != nil {
		return nil, err
	}

	if query != nil {
		q := req.URL.Query()
		for k, v := range query {
			q.Set(k, v)
		}
		req.URL.RawQuery = q.Encode()
	}

	resp, err := c.http.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	bodyBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return nil, fmt.Errorf("%s %s => %d: %s", method, path, resp.StatusCode, string(bodyBytes))
	}

	var raw json.RawMessage
	if err := json.Unmarshal(bodyBytes, &raw); err != nil {
		return nil, err
	}
	return raw, nil
}

// ----- Public market endpoints -----

// OrderBookDetails hits /api/v1/orderBookDetails (list of markets, OI, fees, etc.).
func (c *LighterClient) OrderBookDetails(ctx context.Context) (json.RawMessage, error) {
	return c.doJSON(ctx, http.MethodGet, "/api/v1/orderBookDetails", nil)
}

// ExchangeStats hits /api/v1/exchangeStats (prices + 24h stats).
func (c *LighterClient) ExchangeStats(ctx context.Context) (json.RawMessage, error) {
	return c.doJSON(ctx, http.MethodGet, "/api/v1/exchangeStats", nil)
}

// FundingRates hits /api/v1/funding-rates (multi-exchange funding data).
func (c *LighterClient) FundingRates(ctx context.Context) (json.RawMessage, error) {
	return c.doJSON(ctx, http.MethodGet, "/api/v1/funding-rates", nil)
}

// Fundings hits /api/v1/fundings (historical funding events).
func (c *LighterClient) Fundings(ctx context.Context, query map[string]string) (json.RawMessage, error) {
	return c.doJSON(ctx, http.MethodGet, "/api/v1/fundings", query)
}

// Liquidations hits /api/v1/liquidations (historical liquidation events).
func (c *LighterClient) Liquidations(ctx context.Context, query map[string]string) (json.RawMessage, error) {
	return c.doJSON(ctx, http.MethodGet, "/api/v1/liquidations", query)
}

// ----- Account / positions via /api/v1/account (by l1_address) -----

type AccountPosition struct {
	MarketID             int    `json:"market_id"`
	Symbol               string `json:"symbol"`
	InitialMarginFraction string `json:"initial_margin_fraction"`
	OpenOrderCount       int    `json:"open_order_count"`
	PendingOrderCount    int    `json:"pending_order_count"`
	PositionTiedOrderCount int  `json:"position_tied_order_count"`
	Sign                 int    `json:"sign"`
	Position             string `json:"position"`
	AvgEntryPrice        string `json:"avg_entry_price"`
	PositionValue        string `json:"position_value"`
	UnrealizedPnl        string `json:"unrealized_pnl"`
	RealizedPnl          string `json:"realized_pnl"`
	LiquidationPrice     string `json:"liquidation_price"`
	MarginMode           int    `json:"margin_mode"`
	AllocatedMargin      string `json:"allocated_margin"`
}

type Account struct {
	Code                    int               `json:"code"`
	AccountType             int               `json:"account_type"`
	Index                   int64             `json:"index"`
	L1Address               string            `json:"l1_address"`
	CancelAllTime           int64             `json:"cancel_all_time"`
	TotalOrderCount         int               `json:"total_order_count"`
	TotalIsolatedOrderCount int               `json:"total_isolated_order_count"`
	PendingOrderCount       int               `json:"pending_order_count"`
	AvailableBalance        string            `json:"available_balance"`
	Status                  int               `json:"status"`
	Collateral              string            `json:"collateral"`
	AccountIndex            int64             `json:"account_index"`
	Name                    string            `json:"name"`
	Description             string            `json:"description"`
	CanInvite               bool              `json:"can_invite"`
	ReferralPointsPercentage string           `json:"referral_points_percentage"`
	Positions               []AccountPosition `json:"positions"`
	TotalAssetValue         string            `json:"total_asset_value"`
	CrossAssetValue         string            `json:"cross_asset_value"`
	Shares                  []any             `json:"shares"`
}

type AccountByL1Response struct {
	Code     int       `json:"code"`
	Total    int       `json:"total"`
	Accounts []Account `json:"accounts"`
}

// AccountByL1 wraps GET /api/v1/account?by=l1_address&value=0x...
func (c *LighterClient) AccountByL1(ctx context.Context, addr string) (*AccountByL1Response, error) {
	raw, err := c.doJSON(ctx, http.MethodGet, "/api/v1/account", map[string]string{
		"by":    "l1_address",
		"value": addr,
	})
	if err != nil {
		return nil, err
	}
	var out AccountByL1Response
	if err := json.Unmarshal(raw, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// (Optional legacy) AccountsByL1Address using /api/v1/accountsByL1Address.
// Not used by the current backend, but fixed here for completeness.
type SubAccount struct {
	Code              int    `json:"code"`
	AccountType       int    `json:"account_type"`
	Index             int64  `json:"index"`
	L1Address         string `json:"l1_address"`
	PendingOrderCount int    `json:"pending_order_count"`
	AvailableBalance  string `json:"available_balance"`
	Status            int    `json:"status"`
	Collateral        string `json:"collateral"`
}

type AccountsByL1AddressResponse struct {
	Code      int          `json:"code"`
	L1Address string       `json:"l1_address"`
	SubAcct   []SubAccount `json:"sub_accounts"`
}

func (c *LighterClient) AccountsByL1Address(ctx context.Context, addr string) (*AccountsByL1AddressResponse, error) {
	url := fmt.Sprintf("%s/api/v1/accountsByL1Address?l1_address=%s", c.baseURL, addr)

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("accept", "application/json")

	resp, err := c.http.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var out AccountsByL1AddressResponse
	if err := json.NewDecoder(resp.Body).Decode(&out); err != nil {
		return nil, err
	}
	return &out, nil
}