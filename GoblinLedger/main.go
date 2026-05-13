package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"strconv"

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

	newGoblin := Goblin{}

	json.NewDecoder(r.Body).Decode(&newGoblin)

	db.Create(&newGoblin)

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
