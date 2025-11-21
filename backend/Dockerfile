# backend/Dockerfile
# ---- build stage ----
FROM golang:1.22-bookworm AS builder

WORKDIR /app

# cache deps
COPY go.mod go.sum ./
RUN go mod download

# copy source
COPY . .

# build binary
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 \
    go build -o /lighter-api ./cmd/api

# ---- runtime stage ----
FROM gcr.io/distroless/base-debian12

WORKDIR /app

COPY --from=builder /lighter-api /app/lighter-api

EXPOSE 8080

# distroless has no shell; just run the binary
ENTRYPOINT ["/app/lighter-api"]