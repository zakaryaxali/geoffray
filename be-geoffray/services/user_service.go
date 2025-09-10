package services

import (
	"be-geoffray/db"
	"be-geoffray/models"
	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

// HashPassword hashes a password using bcrypt
func HashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	return string(bytes), err
}

// CheckPasswordHash verifies a password against a hashed one
func CheckPasswordHash(password, hash string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	return err == nil
}

// GetUserByID retrieves a user from the database by their ID
func GetUserByID(c *gin.Context, userID string) (models.User, error) {
	var user models.User
	err := db.DB.QueryRow(`SELECT id, email, first_name, last_name, profile_picture FROM users WHERE id = $1`, userID).Scan(
		&user.ID, &user.Email, &user.FirstName, &user.LastName, &user.ProfilePicture,
	)
	return user, err
}
