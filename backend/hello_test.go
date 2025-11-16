package main

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestHelloHandler(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/api/hello", nil)
	w := httptest.NewRecorder()

	helloHandler(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", w.Code)
	}

	if body := w.Body.String(); body == "" {
		t.Fatalf("expected body, got empty")
	}
}
