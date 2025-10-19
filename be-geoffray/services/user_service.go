package services

import (
	"be-geoffray/db"
	"be-geoffray/models"
	"github.com/gin-gonic/gin"
)

// GetUserByID retrieves a user from the database by their ID
func GetUserByID(c *gin.Context, userID string) (models.User, error) {
	var user models.User
	err := db.DB.QueryRow(`SELECT id, email, first_name, last_name, firebase_uid FROM users WHERE id = $1`, userID).Scan(
		&user.ID, &user.Email, &user.FirstName, &user.LastName, &user.FirebaseUID,
	)
	return user, err
}
