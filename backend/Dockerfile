FROM golang:1.22 AS build
WORKDIR /app
COPY . .
RUN go build -o server .

FROM gcr.io/distroless/base-debian12
WORKDIR /app
COPY --from=build /app/server .
EXPOSE 8080
CMD ["./server"]