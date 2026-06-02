package main

import (
	"encoding/json"
	"fmt"
	"log"
	"log/slog" // Clean, built-in structured logger
	"net/http"
	"os"
	"strconv"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

type Goblin struct {
	ID       uint   `gorm:"primarykey"`
	Username string `gorm:"unique;not null"`
	Password string `gorm:"type:varchar(60);not null"`
	Email    string `gorm:"unique;not null"`
	Clan     string
}

type Contact struct {
	GoblinID uint `gorm:"primaryKey"`
	FriendID uint `gorm:"primaryKey"`
}

type AddContactRequest struct {
	FriendUsername string `json:"friend_username"`
}

type RegisterRequest struct {
	Username string `json:"username"`
	Email    string `json:"email"`
	Clan     string `json:"clan"`
	Password string `json:"password"`
}

type GrabbedGoblin struct {
	ID       uint   `gorm:"primarykey"`
	Username string `gorm:"unique;not null"`
	Clan     string
}

type UpdateProfileRequest struct {
	Email string `json:"email"`
	Clan  string `json:"clan"`
}

type InternalVerifyRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

var db *gorm.DB

func main() {
	// Configure logging format for production (structured JSON)
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))
	slog.SetDefault(logger)

	DatabaseConnection := os.Getenv("DB_URL")
	if DatabaseConnection == "" {
		DatabaseConnection = "host=GoblinLedger user=admin password=penguin dbname=GoblinTime port=5432 sslmode=disable"
	}

	var err error
	db, err = gorm.Open(postgres.Open(DatabaseConnection), &gorm.Config{})

	if err != nil {
		slog.Error("Database connection fatal failure", "error", err)
		panic("Failed to connect to database!")
	}
	slog.Info("Successfully linked to the database ledger")

	db.AutoMigrate(&Goblin{}, &Contact{})

	multiplexer := http.NewServeMux()
	multiplexer.HandleFunc("/{$}", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintf(w, "Goblins believe server is running")
	})

	// Unified Internal & Public RESTful Endpoints
	multiplexer.HandleFunc("POST /internal/verify", internalVerifyHandler)
	multiplexer.HandleFunc("POST /user/register", registerGoblin)
	multiplexer.HandleFunc("GET /user/profile", EndpointCatcher(getGoblin))
	multiplexer.HandleFunc("PATCH /user/profile", EndpointCatcher(updateGoblinProfile))
	multiplexer.HandleFunc("DELETE /user/profile", EndpointCatcher(deleteGoblin))
	multiplexer.HandleFunc("GET /user/contacts", EndpointCatcher(getContacts))
	multiplexer.HandleFunc("POST /user/contacts", EndpointCatcher(addContact))
	multiplexer.HandleFunc("GET /user/contacts/recommendation", EndpointCatcher(GetContactRecommendations))

	slog.Info("Listening on port 8088", "port", 8088)
	log.Fatal(http.ListenAndServe(":8088", multiplexer))
}

func registerGoblin(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	if r.Method != http.MethodPost {
		slog.Warn("Invalid method attempt on register", "method", r.Method)
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	request := RegisterRequest{}
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		slog.Error("Malformed register JSON payload", "error", err)
		http.Error(w, "Malformed payload", http.StatusBadRequest)
		return
	}

	hashed, err := bcrypt.GenerateFromPassword([]byte(request.Password), 10)
	if err != nil {
		slog.Error("Failed to hash password during registration", "error", err)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	newGoblin := Goblin{
		Username: request.Username,
		Password: string(hashed),
		Email:    request.Email,
		Clan:     request.Clan,
	}

	outcome := db.Create(&newGoblin)
	if outcome.Error != nil {
		slog.Error("Database rejected insert for new goblin", "username", request.Username, "error", outcome.Error)
		http.Error(w, "Database rejected insert: "+outcome.Error.Error(), http.StatusInternalServerError)
		return
	}

	slog.Info("New goblin successfully registered", "username", request.Username)
	w.WriteHeader(http.StatusCreated)
}

func deleteGoblin(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	if r.Method != http.MethodDelete {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	userID := r.Header.Get("X-User-ID")
	slog.Info("Executing delete request", "userID", userID)

	didItDelete := db.Where("ID = ?", userID).Delete(&Goblin{})
	if didItDelete.Error != nil {
		slog.Error("Database failed while executing goblin deletion", "userID", userID, "error", didItDelete.Error)
		http.Error(w, "Database failure", http.StatusInternalServerError)
		return
	}

	if didItDelete.RowsAffected == 0 {
		slog.Warn("Delete request issued for target that doesn't exist", "userID", userID)
		http.Error(w, "Goblin not found or already taken care of", http.StatusNotFound)
		return
	}

	slog.Info("Goblin deleted successfully from the records", "userID", userID)
	w.WriteHeader(http.StatusOK)
}

func updateGoblinProfile(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	if r.Method != http.MethodPatch {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	userID := r.Header.Get("X-User-ID")
	var request UpdateProfileRequest
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		slog.Error("Failed to parse update profile JSON", "userID", userID, "error", err)
		http.Error(w, "Invalid JSON payload", http.StatusBadRequest)
		return
	}

	updatedFields := Goblin{
		Email: request.Email,
		Clan:  request.Clan,
	}

	outcome := db.Model(&Goblin{}).Where("id = ?", userID).Updates(&updatedFields)
	if outcome.Error != nil {
		slog.Error("Database rejected profile updates", "userID", userID, "error", outcome.Error)
		http.Error(w, "Database rejected update", http.StatusInternalServerError)
		return
	}

	if outcome.RowsAffected == 0 {
		slog.Warn("Update profile targeted non-existent user", "userID", userID)
		http.Error(w, "Goblin profile not found", http.StatusNotFound)
		return
	}

	slog.Info("Goblin profile updated successfully", "userID", userID, "clan", request.Clan)
	w.WriteHeader(http.StatusOK)
}

func getGoblin(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	if r.Method != http.MethodGet {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	id := r.Header.Get("X-User-ID")
	goblin := GrabbedGoblin{}
	outcome := db.Model(&Goblin{}).Select("id", "username", "clan").First(&goblin, id)

	if outcome.Error != nil {
		if outcome.Error == gorm.ErrRecordNotFound {
			slog.Warn("Profile lookup failed - Goblin record not found", "userID", id)
			http.Error(w, "Goblin not found", http.StatusNotFound)
			return
		}
		slog.Error("Database structural exception during profile grab", "userID", id, "error", outcome.Error)
		http.Error(w, "The Goblin Lords have forsaken you", http.StatusNotFound)
		return
	}

	json.NewEncoder(w).Encode(goblin)
}

func getContacts(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	if r.Method != http.MethodGet {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	userID := r.Header.Get("X-User-ID")
	var contactsList []GrabbedGoblin

	outcome := db.Model((&Goblin{})).Select("goblins.id, goblins.username, goblins.clan").
		Joins("inner join contacts on contacts.friend_id = goblins.id").
		Where("contacts.goblin_id = ?", userID).
		Find(&contactsList)

	if outcome.Error != nil {
		slog.Error("Failed to fetch contact array from ledger", "userID", userID, "error", outcome.Error)
		http.Error(w, "Could not summon your contacts", http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(contactsList)
}

func GetContactRecommendations(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	if r.Method != http.MethodGet {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	userID := r.Header.Get("X-User-ID")
	var recommendations []GrabbedGoblin

	outcome := db.Model(&Goblin{}).Select("DISTINCT goblins.id, goblins.username, goblins.clan").
		Joins("INNER JOIN contacts AS friends_of_friends ON friends_of_friends.friend_id = goblins.id").
		Joins("INNER JOIN contacts AS my_friends ON my_friends.friend_id = friends_of_friends.goblin_id").
		Where("my_friends.goblin_id = ?", userID).
		Where("goblins.id != ?", userID).
		Where("goblins.id NOT IN (SELECT friend_id FROM contacts WHERE goblin_id = ?)", userID).
		Find(&recommendations)

	if outcome.Error != nil {
		slog.Error("Failed execution on network recommendations query", "userID", userID, "error", outcome.Error)
		http.Error(w, "The Goblin network is tangled", http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(recommendations)
}

func EndpointCatcher(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		clientHeader := r.Header.Get("Authorization")
		if clientHeader == "" {
			slog.Warn("Unauthorized access block - Missing token header", "path", r.URL.Path)
			http.Error(w, "NOT AUTHORIZED TO BE HERE....", http.StatusUnauthorized)
			return
		}

		authCheck, err := http.NewRequest("GET", "http://goblin-security:8089/validate", nil)
		if err != nil {
			slog.Error("Failed creating token validation internal object", "error", err)
			http.Error(w, "Internal validation client configuration error", http.StatusInternalServerError)
			return
		}

		authCheck.Header.Set("Authorization", clientHeader)
		httpClient := &http.Client{}
		authResp, err := httpClient.Do(authCheck)
		if err != nil {
			slog.Error("Authentication security container unreachable over internal network", "error", err)
			http.Error(w, "Authentication service unreachable", http.StatusInternalServerError)
			return
		}
		defer authResp.Body.Close()

		if authResp.StatusCode != http.StatusOK {
			slog.Warn("Security cluster node rejected provided token status", "statusCode", authResp.StatusCode, "path", r.URL.Path)
			http.Error(w, "THE GOBLIN LORDS REJECT YOUR TOKEN", http.StatusUnauthorized)
			return
		}

		userID := authResp.Header.Get("X-User-ID")
		slog.Info("Request authentication successful", "userID", userID, "path", r.URL.Path)
		r.Header.Set("X-User-ID", userID)
		next(w, r)
	}
}

func internalVerifyHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	var req InternalVerifyRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		slog.Error("Failed parsing internal microservice verification fields", "error", err)
		http.Error(w, "Malformed internal request", http.StatusBadRequest)
		return
	}

	userID := DoesGoblinExist(req.Username, req.Password)
	if userID == -1 {
		slog.Warn("Internal login token check failure: invalid matching credentials", "username", req.Username)
		http.Error(w, "Invalid credentials", http.StatusUnauthorized)
		return
	}

	slog.Info("Internal verified auth success", "username", req.Username, "userID", userID)
	json.NewEncoder(w).Encode(map[string]int{"userID": userID})
}

func DoesGoblinExist(username string, password string) int {
	if username == "" || password == "" {
		return -1
	}

	var goblinInQuestion Goblin
	err := db.Where("username = ?", username).First(&goblinInQuestion).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return -1
		}
		slog.Error("Database query crash checking goblin existence", "username", username, "error", err)
		return -1
	}

	err = bcrypt.CompareHashAndPassword([]byte(goblinInQuestion.Password), []byte(password))
	if err != nil {
		return -1
	}

	return int(goblinInQuestion.ID)
}

func addContact(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	userIDStr := r.Header.Get("X-User-ID")
	userID, err := strconv.ParseUint(userIDStr, 10, 64)
	if err != nil {
		slog.Error("Failed mapping runtime string context into parsed UserID integer", "extractedHeader", userIDStr, "error", err)
		http.Error(w, "Invalid user identification", http.StatusBadRequest)
		return
	}

	var request AddContactRequest
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		slog.Error("Failed parsing relationship creation metadata parameters", "userID", userID, "error", err)
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	var friendGoblin Goblin
	err = db.Where("username = ?", request.FriendUsername).First(&friendGoblin).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			slog.Warn("Failed contact creation request: target goblin user handle does not exist", "senderID", userID, "targetUsername", request.FriendUsername)
			http.Error(w, "That goblin does not exist in our records", http.StatusNotFound)
			return
		}
		slog.Error("Database failure while validating target friend identity", "senderID", userID, "error", err)
		http.Error(w, "Database search failure", http.StatusInternalServerError)
		return
	}

	if uint(userID) == friendGoblin.ID {
		slog.Warn("Validation gate rejected contact creation: user attempted to map alliance to themselves", "userID", userID)
		http.Error(w, "You cannot add yourself to your own ledger", http.StatusBadRequest)
		return
	}

	var existingRelationship Contact
	check := db.Where("goblin_id = ? AND friend_id = ?", userID, friendGoblin.ID).First(&existingRelationship)
	if check.Error == nil {
		slog.Warn("Blocked duplicate contact entry submission", "userID", userID, "friendID", friendGoblin.ID)
		http.Error(w, "This goblin is already in your contacts", http.StatusConflict)
		return
	}

	newContact := Contact{
		GoblinID: uint(userID),
		FriendID: friendGoblin.ID,
	}

	outcome := db.Create(&newContact)
	if outcome.Error != nil {
		slog.Error("Database write error finalizing contact ledger row insertion", "userID", userID, "friendID", friendGoblin.ID, "error", outcome.Error)
		http.Error(w, "The database rejected the alliance", http.StatusInternalServerError)
		return
	}

	slog.Info("New ledger alliance saved cleanly", "userID", userID, "friendID", friendGoblin.ID)
	w.WriteHeader(http.StatusCreated)
}
