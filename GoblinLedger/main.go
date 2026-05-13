package main

import (
	"encoding/json"
	"fmt"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"net/http"
	"os"
)

type Goblin struct {
	ID       uint `gorm:"primarykey"`
	Username string
	Email    string
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

	multiplexer.HandleFunc("/NewGoblin", registerGoblin)

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
