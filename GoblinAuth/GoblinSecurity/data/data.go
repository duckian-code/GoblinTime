package data

import (
	"os"

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

var db *gorm.DB

func ConnectDatabase() error {
	databaseConnection := os.Getenv("DB_URL")
	if databaseConnection == "" {
		databaseConnection = "host=GoblinLedger user=admin password=penguin dbname=GoblinTime port=5432 sslmode=disable"
	}

	var err error
	db, err = gorm.Open(postgres.Open(databaseConnection), &gorm.Config{})
	return err
}

func DoesGoblinExist(username string, password string) int {
	if username == "" || password == "" {
		return -1
	}

	var goblinInQuestion Goblin

	err := db.Where("username = ?", username).First(&goblinInQuestion).Error
	if err != nil {
		return -1
	}

	err = bcrypt.CompareHashAndPassword([]byte(goblinInQuestion.Password), []byte(password))
	if err != nil {
		return -1
	}

	return int(goblinInQuestion.ID)
}
