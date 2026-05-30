package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/livekit/protocol/auth" // The LiveKit Go SDK package!
)

type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type VideoTokenRequest struct {
	Room     string `json:"room"`
	Identity string `json:"identity"`
}

func main() {

	if os.Getenv("JWT_SECRET") == "" {
		log.Fatal("JWT_SECRET environment variable is required.")
	}

	if os.Getenv("api_key") == "" || os.Getenv("api_secret") == "" {
		fmt.Println("Warning: api_key or api_secret is missing.")
	}

	mux := http.NewServeMux()
	mux.HandleFunc("POST /user/login", loginHandler)
	mux.HandleFunc("GET /validate", validateHandler)
	mux.HandleFunc("POST /video/token", tokenHandler)

	fmt.Println("Auth service listening on port 8089")
	log.Fatal(http.ListenAndServe(":8089", mux))
}

func loginHandler(w http.ResponseWriter, r *http.Request) {
	var lr LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&lr); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	verifyPayload, err := json.Marshal(map[string]string{
		"username": lr.Username,
		"password": lr.Password,
	})
	if err != nil {
		http.Error(w, "Internal serialization error", http.StatusInternalServerError)
		return
	}

	UserServiceVerifyEndPoint := "http://LedgerManager:8088/internal/verify"
	resp, err := http.Post(UserServiceVerifyEndPoint, "application/json", bytes.NewBuffer(verifyPayload))
	if err != nil {
		http.Error(w, "User database service is unreachable", http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		http.Error(w, "Invalid Username or Password", http.StatusUnauthorized)
		return
	}

	var result map[string]int
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		http.Error(w, "Failed to parse user identity", http.StatusInternalServerError)
		return
	}

	userID := result["userID"]

	token, err := generateToken(userID)
	if err != nil {
		http.Error(w, "Error Generating Token", http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(map[string]string{"token": token})
}

func validateHandler(w http.ResponseWriter, r *http.Request) {
	authHeader := r.Header.Get("Authorization")
	if authHeader == "" {
		w.WriteHeader(http.StatusUnauthorized)
		return
	}

	tokenString := ""
	if len(authHeader) > 7 && authHeader[:7] == "Bearer " {
		tokenString = authHeader[7:]
	}

	claims := jwt.MapClaims{}
	token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method")
		}
		return []byte(os.Getenv("JWT_SECRET")), nil
	})

	if err != nil || !token.Valid {
		w.WriteHeader(http.StatusUnauthorized)
		return
	}

	if userID, ok := claims["sub"].(float64); ok {
		w.Header().Set("X-User-ID", fmt.Sprintf("%.0f", userID))
		w.WriteHeader(http.StatusOK)
		return
	}

	w.WriteHeader(http.StatusUnauthorized)
}

func generateToken(userID int) (string, error) {
	claims := jwt.MapClaims{
		"sub": userID,
		"exp": time.Now().Add(time.Hour * 24).Unix(),
		"iat": time.Now().Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(os.Getenv("JWT_SECRET")))
}

func tokenHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req VideoTokenRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid payload", http.StatusBadRequest)
		return
	}

	if req.Room == "" || req.Identity == "" {
		http.Error(w, "Missing room name or user identity", http.StatusBadRequest)
		return
	}

	apiKey := os.Getenv("api_key")
	apiSecret := os.Getenv("api_secret")

	token, err := getJoinToken(apiKey, apiSecret, req.Room, req.Identity)
	if err != nil {
		http.Error(w, "Failed creating LiveKit token", http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(map[string]string{"video_token": token})
}

// Core SDK code you and your teammate drafted
func getJoinToken(apiKey, apiSecret, room, identity string) (string, error) {
	at := auth.NewAccessToken(apiKey, apiSecret)
	grant := &auth.VideoGrant{
		RoomJoin: true,
		Room:     room,
	}
	at.SetVideoGrant(grant).
		SetIdentity(identity).
		SetValidFor(time.Hour)

	return at.ToJWT()
}
