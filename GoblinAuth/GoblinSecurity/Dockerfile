FROM golang:1.26-alpine AS builder

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux go build -o AuthManager .

FROM alpine:latest

WORKDIR /root/

COPY --from=builder /app/AuthManager .

EXPOSE 8089

CMD ["./AuthManager"]
