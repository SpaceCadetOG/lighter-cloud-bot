// backend/cmd/api/main.go
package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strconv"
	"sync"
	"time"

	internal "github.com/SpaceCadetOG/lighter-cloud-bot/backend/internal/lighter"
	"github.com/gorilla/websocket"
	"github.com/joho/godotenv"
)

// ---------- Account Types (positions + orders) ----------

type PositionRow struct {
	Symbol           string  `json:"symbol"`
	Side             string  `json:"side"` // "long" or "short"
	SizeUsd          float64 `json:"size_usd"`
	SizeContracts    float64 `json:"size_contracts"`
	EntryPrice       float64 `json:"entry_price"`
	MarkPrice        float64 `json:"mark_price"`
	Leverage         float64 `json:"leverage"`
	UnrealizedPnlUsd float64 `json:"unrealized_pnl_usd"`
	RealizedPnlUsd   float64 `json:"realized_pnl_usd"`
	MarginUsedUsd    float64 `json:"margin_used_usd"`
}

type AccountSummary struct {
	AccountID          string  `json:"account_id"`
	BalanceUsd         float64 `json:"balance_usd"`           // sum of collateral across all subaccts
	EquityUsd          float64 `json:"equity_usd"`            // balance + unrealized (for now same)
	UnrealizedPnlUsd   float64 `json:"unrealized_pnl_usd"`    // TODO: aggregate from positions
	RealizedPnlUsd     float64 `json:"realized_pnl_usd"`      // TODO: from PnL history
	MarginUsedUsd      float64 `json:"margin_used_usd"`       // ∑ allocated_margin (later)
	MarginAvailableUsd float64 `json:"margin_available_usd"`  // equity - margin_used
	EffectiveLeverage  float64 `json:"effective_leverage"`    // equity / margin_used
	Sharpe30d          float64 `json:"sharpe_30d"`            // placeholder
}

type OrderRow struct {
	OrderID        string  `json:"order_id"`
	Symbol         string  `json:"symbol"`
	Side           string  `json:"side"`   // buy / sell
	Type           string  `json:"type"`   // market / limit
	Status         string  `json:"status"` // open / filled / cancelled
	Price          float64 `json:"price,omitempty"`
	SizeUsd        float64 `json:"size_usd,omitempty"`
	SizeContracts  float64 `json:"size_contracts,omitempty"`
	Leverage       float64 `json:"leverage"`
	ReduceOnly     bool    `json:"reduce_only"`
	ClientID       string  `json:"client_id,omitempty"`
	CreatedAtEpoch int64   `json:"created_at_epoch"`
}

// in-memory order log to drive "Working & Recent Orders" UI
var (
	orderLogMu sync.Mutex
	orderLog   []OrderRow
)

// ---------- Market Types ----------

type MarketRow struct {
	Symbol       string  `json:"symbol"`
	MarketID     int     `json:"market_id"`
	Status       string  `json:"status"`
	TakerFee     string  `json:"taker_fee"`
	MakerFee     string  `json:"maker_fee"`
	OpenInterest float64 `json:"open_interest"`

	IndexPrice   float64 `json:"index_price"`
	MarkPrice    float64 `json:"mark_price"`
	Change24hPct float64 `json:"change_24h_pct"`

	OpenInterestUsd float64 `json:"open_interest_usd"`
	Volume24hUsd    float64 `json:"volume_24h_usd"`
	FundingRate8h   float64 `json:"funding_rate_8h"`
}

type lighterMarketsResponse struct {
	Code             int         `json:"code"`
	OrderBookDetails []MarketRow `json:"order_book_details"`
}

type exchangeStat struct {
	Symbol                string  `json:"symbol"`
	LastTradePrice        float64 `json:"last_trade_price"`
	DailyPriceChange      float64 `json:"daily_price_change"`
	DailyBaseTokenVolume  float64 `json:"daily_base_token_volume"`
	DailyQuoteTokenVolume float64 `json:"daily_quote_token_volume"`
}

type exchangeStatsResponse struct {
	Code           int            `json:"code"`
	Total          int            `json:"total"`
	OrderBookStats []exchangeStat `json:"order_book_stats"`
}

type fundingRateRow struct {
	MarketID int     `json:"market_id"`
	Exchange string  `json:"exchange"`
	Symbol   string  `json:"symbol"`
	Rate     float64 `json:"rate"`
}

type fundingRatesResponse struct {
	Code         int              `json:"code"`
	FundingRates []fundingRateRow `json:"funding_rates"`
}

// ---------- Trade / Order Types ----------

type OrderRequest struct {
	Symbol        string   `json:"symbol"`
	Side          string   `json:"side"` // "buy" | "sell"
	Type          string   `json:"type"` // "market" | "limit"
	Price         *float64 `json:"price,omitempty"`
	SizeUSD       *float64 `json:"size_usd,omitempty"`
	SizeContracts *float64 `json:"size_contracts,omitempty"`
	Leverage      float64  `json:"leverage"`
	ReduceOnly    bool     `json:"reduce_only"`
	ClientID      string   `json:"client_id"`

	StopLoss   *float64 `json:"stop_loss,omitempty"`
	TakeProfit *float64 `json:"take_profit,omitempty"`
}

type OrderResponse struct {
	OrderID string       `json:"order_id"`
	Status  string       `json:"status"`
	Message string       `json:"message,omitempty"`
	Request OrderRequest `json:"request"`
}

// ---------- Helpers ----------

func loadEnv() {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found (or failed to load):", err)
	} else {
		log.Println(".env loaded successfully")
	}
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

// --- exchange stats (prices, 24h %, volume) ---

func fetchStatsMap(ctx context.Context, lc *internal.LighterClient) (map[string]exchangeStat, error) {
	raw, err := lc.ExchangeStats(ctx)
	if err != nil {
		return nil, err
	}

	var resp exchangeStatsResponse
	if err := json.Unmarshal(raw, &resp); err != nil {
		return nil, err
	}

	stats := make(map[string]exchangeStat, len(resp.OrderBookStats))
	for _, st := range resp.OrderBookStats {
		stats[st.Symbol] = st
	}
	return stats, nil
}

// --- funding rates ---

func fetchFundingMap(ctx context.Context, lc *internal.LighterClient) (map[string]float64, error) {
	raw, err := lc.FundingRates(ctx)
	if err != nil {
		return nil, err
	}

	var resp fundingRatesResponse
	if err := json.Unmarshal(raw, &resp); err != nil {
		return nil, err
	}

	m := make(map[string]float64, len(resp.FundingRates))
	for _, fr := range resp.FundingRates {
		m[fr.Symbol] = fr.Rate
	}
	return m, nil
}

// Combine orderBookDetails + exchangeStats + funding into []MarketRow.
func loadMarketsMerged(ctx context.Context, lc *internal.LighterClient) ([]MarketRow, error) {
	rawDetails, err := lc.OrderBookDetails(ctx)
	if err != nil {
		return nil, err
	}

	var details lighterMarketsResponse
	if err := json.Unmarshal(rawDetails, &details); err != nil {
		return nil, err
	}

	statsMap, err := fetchStatsMap(ctx, lc)
	if err != nil {
		log.Printf("fetchStatsMap error: %v", err)
	}

	fundingMap, err := fetchFundingMap(ctx, lc)
	if err != nil {
		log.Printf("fetchFundingMap error: %v", err)
	}

	rows := details.OrderBookDetails

	for i := range rows {
		m := &rows[i]

		if statsMap != nil {
			if st, ok := statsMap[m.Symbol]; ok {
				price := st.LastTradePrice
				m.IndexPrice = price
				m.MarkPrice = price
				m.Change24hPct = st.DailyPriceChange
				m.Volume24hUsd = st.DailyQuoteTokenVolume
			}
		}

		px := m.MarkPrice
		if px == 0 {
			px = m.IndexPrice
		}
		if px != 0 {
			m.OpenInterestUsd = m.OpenInterest * px
		} else {
			m.OpenInterestUsd = 0
		}

		if fundingMap != nil {
			if rate, ok := fundingMap[m.Symbol]; ok {
				m.FundingRate8h = rate
			}
		}
	}

	return rows, nil
}

// ----- /api/trade/order handler (stubbed execution) -----

func handleTradeOrder(lc *internal.LighterClient) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			writeJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "method not allowed"})
			return
		}

		var req OrderRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			log.Printf("order decode error: %v", err)
			writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid JSON"})
			return
		}

		// TODO: wire lc.PlaceOrder once we implement signing

		if req.Symbol == "" {
			writeJSON(w, http.StatusBadRequest, map[string]string{"error": "symbol is required"})
			return
		}
		if req.Side != "buy" && req.Side != "sell" {
			writeJSON(w, http.StatusBadRequest, map[string]string{"error": "side must be 'buy' or 'sell'"})
			return
		}
		if req.Type != "market" && req.Type != "limit" {
			writeJSON(w, http.StatusBadRequest, map[string]string{"error": "type must be 'market' or 'limit'"})
			return
		}
		if req.Type == "limit" {
			if req.Price == nil || *req.Price <= 0 {
				writeJSON(w, http.StatusBadRequest, map[string]string{"error": "limit orders require positive price"})
				return
			}
		}
		if (req.SizeUSD == nil || *req.SizeUSD <= 0) &&
			(req.SizeContracts == nil || *req.SizeContracts <= 0) {
			writeJSON(w, http.StatusBadRequest, map[string]string{
				"error": "size_usd or size_contracts must be > 0",
			})
			return
		}

		log.Printf("NEW ORDER (stub): %+v", req)

		devOrderID := fmt.Sprintf("dev-%d", time.Now().UnixNano())
		now := time.Now().Unix()

		resp := OrderResponse{
			OrderID: devOrderID,
			Status:  "accepted",
			Message: "stubbed order (not sent to exchange yet)",
			Request: req,
		}

		// add to in-memory order log so the UI can see "Working & Recent Orders"
		orderLogMu.Lock()
		orderLog = append(orderLog, OrderRow{
			OrderID:        devOrderID,
			Symbol:         req.Symbol,
			Side:           req.Side,
			Type:           req.Type,
			Status:         "open",
			Price: func() float64 {
				if req.Price != nil {
					return *req.Price
				}
				return 0
			}(),
			SizeUsd: func() float64 {
				if req.SizeUSD != nil {
					return *req.SizeUSD
				}
				return 0
			}(),
			SizeContracts: func() float64 {
				if req.SizeContracts != nil {
					return *req.SizeContracts
				}
				return 0
			}(),
			Leverage:       req.Leverage,
			ReduceOnly:     req.ReduceOnly,
			ClientID:       req.ClientID,
			CreatedAtEpoch: now,
		})
		orderLogMu.Unlock()

		writeJSON(w, http.StatusOK, resp)
	}
}

// ---------- main / handlers ----------

func main() {
	loadEnv()

	lc := internal.NewLighterClientFromEnv()
	mux := http.NewServeMux()

	// health
	mux.HandleFunc("/api/healthz", func(w http.ResponseWriter, r *http.Request) {
		_, _ = w.Write([]byte("backend-ok"))
	})

	// simple status
	mux.HandleFunc("/api/status", func(w http.ResponseWriter, r *http.Request) {
		writeJSON(w, http.StatusOK, map[string]any{
			"network_id": 1,
			"status":     200,
			"timestamp":  time.Now().Unix(),
		})
	})

	// ----- markets -----
	mux.HandleFunc("/api/markets", func(w http.ResponseWriter, r *http.Request) {
		rows, err := loadMarketsMerged(r.Context(), lc)
		if err != nil {
			log.Printf("/api/markets error: %v", err)
			writeJSON(w, http.StatusBadGateway, map[string]string{"error": err.Error()})
			return
		}
		writeJSON(w, http.StatusOK, rows)
	})

	mux.HandleFunc("/api/markets/live", func(w http.ResponseWriter, r *http.Request) {
		rows, err := loadMarketsMerged(r.Context(), lc)
		if err != nil {
			log.Printf("/api/markets/live error: %v", err)
			writeJSON(w, http.StatusBadGateway, map[string]string{"error": err.Error()})
			return
		}
		writeJSON(w, http.StatusOK, rows)
	})

	// ----- ws markets -----
	mux.HandleFunc("/ws/markets", func(w http.ResponseWriter, r *http.Request) {
		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			log.Printf("ws upgrade error: %v", err)
			return
		}
		defer conn.Close()

		ctx := r.Context()
		ticker := time.NewTicker(2 * time.Second) // slightly slower to avoid 429s
		defer ticker.Stop()

		type WSMessage struct {
			Markets []MarketRow `json:"markets"`
		}

		for {
			select {
			case <-ctx.Done():
				return
			case <-ticker.C:
				rows, err := loadMarketsMerged(ctx, lc)
				if err != nil {
					log.Printf("ws loadMarketsMerged error: %v", err)
					return
				}
				if err := conn.WriteJSON(WSMessage{Markets: rows}); err != nil {
					log.Printf("ws write error: %v", err)
					return
				}
			}
		}
	})

	// ----- REAL /api/account/summary from /account -----
	mux.HandleFunc("/api/account/summary", func(w http.ResponseWriter, r *http.Request) {
		addr := os.Getenv("LIGHTER_L1_ADDRESS")
		if addr == "" {
			writeJSON(w, http.StatusBadRequest, map[string]string{
				"error": "LIGHTER_L1_ADDRESS not set in env",
			})
			return
		}

		resp, err := lc.AccountByL1(r.Context(), addr)
		if err != nil {
			log.Printf("AccountByL1 error: %v", err)
			writeJSON(w, http.StatusBadGateway, map[string]string{
				"error": "failed to fetch accounts",
			})
			return
		}

		var (
			totalCollateral float64
			totalMarginUsed float64
		)

		for _, acct := range resp.Accounts {
			if acct.Collateral != "" {
				if f, err := strconv.ParseFloat(acct.Collateral, 64); err == nil {
					totalCollateral += f
				}
			}
			for _, p := range acct.Positions {
				if p.AllocatedMargin != "" {
					if f, err := strconv.ParseFloat(p.AllocatedMargin, 64); err == nil {
						totalMarginUsed += f
					}
				}
			}
		}

		balance := totalCollateral
		equity := totalCollateral // until we add unrealized PnL on top
		marginUsed := totalMarginUsed
		marginAvail := equity - marginUsed
		var effLev float64
		if marginUsed > 0 {
			effLev = equity / marginUsed
		} else {
			effLev = 0
		}

		summary := AccountSummary{
			AccountID:          addr,
			BalanceUsd:         balance,
			EquityUsd:          equity,
			UnrealizedPnlUsd:   0,
			RealizedPnlUsd:     0,
			MarginUsedUsd:      marginUsed,
			MarginAvailableUsd: marginAvail,
			EffectiveLeverage:  effLev,
			Sharpe30d:          0,
		}

		writeJSON(w, http.StatusOK, summary)
	})

	// ----- /api/account/positions : flatten positions over all subaccts -----
	mux.HandleFunc("/api/account/positions", func(w http.ResponseWriter, r *http.Request) {
		addr := os.Getenv("LIGHTER_L1_ADDRESS")
		if addr == "" {
			writeJSON(w, http.StatusBadRequest, map[string]string{
				"error": "LIGHTER_L1_ADDRESS not set in env",
			})
			return
		}

		accountResp, err := lc.AccountByL1(r.Context(), addr)
		if err != nil {
			log.Printf("AccountByL1 error: %v", err)
			writeJSON(w, http.StatusBadGateway, map[string]string{
				"error": "failed to fetch account positions",
			})
			return
		}

		// Map symbol -> mark price from merged markets
		markets, err := loadMarketsMerged(r.Context(), lc)
		if err != nil {
			log.Printf("loadMarketsMerged error in positions: %v", err)
		}
		priceMap := make(map[string]float64)
		for _, m := range markets {
			px := m.MarkPrice
			if px == 0 {
				px = m.IndexPrice
			}
			if px != 0 {
				priceMap[m.Symbol] = px
			}
		}

		var out []PositionRow

		for _, acct := range accountResp.Accounts {
			for _, p := range acct.Positions {
				qty, _ := strconv.ParseFloat(p.Position, 64)
				if qty == 0 {
					continue
				}

				posVal, _ := strconv.ParseFloat(p.PositionValue, 64)
				entry, _ := strconv.ParseFloat(p.AvgEntryPrice, 64)
				upnl, _ := strconv.ParseFloat(p.UnrealizedPnl, 64)
				rpnl, _ := strconv.ParseFloat(p.RealizedPnl, 64)
				allocMargin, _ := strconv.ParseFloat(p.AllocatedMargin, 64)
				imf, _ := strconv.ParseFloat(p.InitialMarginFraction, 64)

				lev := 0.0
				if imf > 0 {
					lev = 100.0 / imf
				}

				px := priceMap[p.Symbol]
				if px == 0 && qty != 0 {
					if posVal != 0 {
						px = posVal / qty
					}
				}

				side := "long"
				if p.Sign < 0 {
					side = "short"
				}

				sizeUsd := posVal
				if sizeUsd < 0 {
					sizeUsd = -sizeUsd
				}

				out = append(out, PositionRow{
					Symbol:           p.Symbol,
					Side:             side,
					SizeUsd:          sizeUsd,
					SizeContracts:    qty,
					EntryPrice:       entry,
					MarkPrice:        px,
					Leverage:         lev,
					UnrealizedPnlUsd: upnl,
					RealizedPnlUsd:   rpnl,
					MarginUsedUsd:    allocMargin,
				})
			}
		}

		writeJSON(w, http.StatusOK, map[string]any{
			"positions": out,
		})
	})

	// ----- /api/account/orders : returns local log for now -----
	mux.HandleFunc("/api/account/orders", func(w http.ResponseWriter, r *http.Request) {
		orderLogMu.Lock()
		defer orderLogMu.Unlock()

		// copy to avoid race if UI mutates accidentally
		out := make([]OrderRow, len(orderLog))
		copy(out, orderLog)

		writeJSON(w, http.StatusOK, map[string]any{
			"orders": out,
		})
	})

	// ----- trade order -----
	mux.HandleFunc("/api/trade/order", handleTradeOrder(lc))

	handler := withCORS(mux)

	addr := ":8080"
	log.Printf("Starting backend on %s\n", addr)
	log.Fatal(http.ListenAndServe(addr, handler))
}