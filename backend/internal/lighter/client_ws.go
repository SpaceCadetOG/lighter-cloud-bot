// backend/internal/lighter/client_ws.go
package internal

import (
    // "context"
    // "encoding/json"
    // "log"
    "net/http"
    // "time"

    "github.com/gorilla/websocket"
)

// --- types ---

type MarketRow struct {
	Symbol       string  `json:"symbol"`
	MarketID     int     `json:"market_id"`
	Status       string  `json:"status"`
	TakerFee     string  `json:"taker_fee"`
	MakerFee     string  `json:"maker_fee"`
	OpenInterest float64 `json:"open_interest"`
	// add more fields later if you want
	// these will be 0 if Lighter doesn’t send them yet
	IndexPrice   float64 `json:"index_price"`
	MarkPrice    float64 `json:"mark_price"`
	Change24hPct float64 `json:"change_24h_pct"`
}

type lighterMarketsResponse struct {
    Code             int         `json:"code"`
    OrderBookDetails []MarketRow `json:"order_book_details"`
}

var upgrader = websocket.Upgrader{
    CheckOrigin: func(r *http.Request) bool {
        // dev: allow all origins (Next.js, etc.)
        return true
    },
}