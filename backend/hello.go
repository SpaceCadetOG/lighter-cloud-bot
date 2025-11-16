package main

import (
	"fmt"
	"log"
	"net/http"
)

func helloHandler(w http.ResponseWriter, r *http.Request) {
	fmt.Fprintln(w, "Hello from Go backend 🚀")
}

func main() {
	mux := http.NewServeMux()
	mux.HandleFunc("/api/hello", helloHandler)

	addr := ":8080"
	log.Printf("Starting server on %s\n", addr)
	if err := http.ListenAndServe(addr, mux); err != nil {
		log.Fatal(err)
	}
}