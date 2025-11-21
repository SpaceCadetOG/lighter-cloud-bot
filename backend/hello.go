package main

import (
    "fmt"
    "log"
    "os"

    "github.com/joho/godotenv"
)

func loadEnv() {
    if err := godotenv.Load(); err != nil {
        log.Println("No .env file found (or failed to load):", err)
    } else {
        log.Println(".env loaded successfully")
    }
}

func printLighterAddress() {
    apiKey := os.Getenv("LIGHTER_L1_ADDRESS")
    fmt.Println("LIGHTER_L1_ADDRESS:", apiKey)
}

func main() {
    loadEnv()          // 1) load .env
    printLighterAddress() // 2) THEN read env
}