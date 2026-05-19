package main

import (
	"encoding/json"
	"fmt"
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

var db *gorm.DB

func main() {
	DatabaseConnection := os.Getenv("DB_URL")
	if DatabaseConnection == "" {
		DatabaseConnection = "host=GoblinLedger user=admin password=penguin dbname=GoblinTime port=5432 sslmode=disable"
	}

	var err error
	db, err = gorm.Open(postgres.Open(DatabaseConnection), &gorm.Config{})

	if err != nil {
		fmt.Println("Failed to connect to database")
		return
	}

	db.AutoMigrate(&Goblin{})

	multiplexer := http.NewServeMux()
	multiplexer.HandleFunc("/{$}", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintf(w, "Goblins believe server is running")
	})

	multiplexer.HandleFunc("/newgoblin/register", registerGoblin)
	multiplexer.HandleFunc("/grabgoblin/{id}", getGoblin)

	fmt.Println("Listening on port 8088...HOPEFULLY")
	http.ListenAndServe(":8088", multiplexer)

}

func registerGoblin(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	request := RegisterRequest{}

	json.NewDecoder(r.Body).Decode(&request)

	hashed, err := bcrypt.GenerateFromPassword([]byte(request.Password), 10)
	if err != nil {
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
		http.Error(w, "Database rejected insert: "+outcome.Error.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	return

}

func deleteGoblin(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	if r.Method != http.MethodDelete {
		w.WriteHeader(http.StatusMethodNotAllowed)
	}

	// I WILL FINISH LATER. i need bearer token for this
}

func getGoblin(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	if r.Method != http.MethodGet {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	idStr := r.PathValue("id")

	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid Goblin ID format", http.StatusBadRequest)
		return
	}

	goblin := GrabbedGoblin{}

	outcome := db.Model(&Goblin{}).Select("id", "username", "clan").First(&goblin, id)

	if outcome.Error != nil {
		if outcome.Error == gorm.ErrRecordNotFound {
			http.Error(w, "Goblin not found", http.StatusNotFound)
			return
		}
		http.Error(w, "The Goblin Lords have forsaken you", http.StatusNotFound)
		return
	}

	json.NewEncoder(w).Encode(goblin)
}

func DoesGoblinExist(username string, password string) int {
	if username == "" || password == "" {
		return -1
	}

	var goblinInQuestion Goblin

	err := db.Where("username = ?", username).Scan(&goblinInQuestion).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return -1 //If this is hit than it doesnt exist in our records
		}
		return -1 // database error???
	}

	err = bcrypt.CompareHashAndPassword([]byte(goblinInQuestion.Password), []byte(password))
	if err != nil {
		return -1
	}

	return int(goblinInQuestion.ID)

}
