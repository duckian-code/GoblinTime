
FROM golang:1.26-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN go build -o GoblinLedger main.go

#this is a two parter incase we do K8s
FROM alpine:latest
WORKDIR /root/
COPY --from=builder /app/GoblinLedger .

EXPOSE 8088
CMD ["./GoblinLedger"]