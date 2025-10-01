package controllers

import (
	"database/sql"
	"fmt"
	"net/http"
	"time"

	"be-geoffray/api/middlewares"
	"be-geoffray/db"
	"be-geoffray/models"
	"be-geoffray/services"

	"github.com/gin-gonic/gin"
)

// Register handles user signup
func Register(c *gin.Context) {
	var input models.User

	// Bind JSON input
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Hash password
	hashedPassword, err := services.HashPassword(input.Password)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not hash password"})
		return
	}

	input.Password = hashedPassword

	// Save user to DB
	query := `INSERT INTO users (first_name, last_name, email, password, profile_picture, created_at, updated_at) 
          VALUES ($1, $2, $3, $4, $5, $6, $7)`

	now := time.Now()
	_, err = db.DB.Exec(
		query,
		input.FirstName,
		input.LastName,
		input.Email,
		input.Password,
		input.ProfilePicture,
		now,
		now,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not create user"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "User registered successfully"})
}

// Login handles user authentication
func Login(c *gin.Context) {
	var input models.User
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Find user
	var user models.User
	query := `SELECT id, first_name, last_name, email, password, profile_picture, created_at, updated_at 
          FROM users WHERE email = $1`

	err := db.DB.QueryRow(query, input.Email).Scan(
		&user.ID,
		&user.FirstName,
		&user.LastName,
		&user.Email,
		&user.Password,
		&user.ProfilePicture,
		&user.CreatedAt,
		&user.UpdatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error: " + err.Error()})
		}
		return
	}

	// Verify password
	if !services.CheckPasswordHash(input.Password, user.Password) {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	// Generate token pair (access token + refresh token)
	tokenResponse, err := middlewares.GenerateTokenPair(user.ID)
	if err != nil {
		// Log the detailed error for debugging
		fmt.Printf("Token generation error: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not generate tokens: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, tokenResponse)
}

func GetUserProfile(c *gin.Context) {
	// Get user ID from context (set by JWT middleware)
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Query the database for user information
	var user models.User
	query := `SELECT id, first_name, last_name, email, profile_picture, created_at, updated_at 
          FROM users WHERE id = $1`

	err := db.DB.QueryRow(query, userID).Scan(
		&user.ID,
		&user.FirstName,
		&user.LastName,
		&user.Email,
		&user.ProfilePicture,
		&user.CreatedAt,
		&user.UpdatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error: " + err.Error()})
		}
		return
	}

	// Don't return password
	user.Password = ""

	c.JSON(http.StatusOK, user)
}

// UpdateUserProfile handles updating user information
func UpdateUserProfile(c *gin.Context) {
	// Get user ID from context (set by JWT middleware)
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Bind the input JSON
	var input struct {
		FirstName      *string `json:"first_name,omitempty"`
		LastName       *string `json:"last_name,omitempty"`
		Email          *string `json:"email,omitempty"`
		Password       *string `json:"password,omitempty"`
		ProfilePicture *string `json:"profile_picture,omitempty"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Start building the update query
	query := "UPDATE users SET updated_at = $1"
	args := []interface{}{time.Now()}
	paramCount := 1

	// Add fields to update only if they're provided
	if input.FirstName != nil {
		paramCount++
		query += fmt.Sprintf(", first_name = $%d", paramCount)
		args = append(args, *input.FirstName)
	}

	if input.LastName != nil {
		paramCount++
		query += fmt.Sprintf(", last_name = $%d", paramCount)
		args = append(args, *input.LastName)
	}

	if input.Email != nil {
		paramCount++
		query += fmt.Sprintf(", email = $%d", paramCount)
		args = append(args, *input.Email)
	}

	if input.ProfilePicture != nil {
		paramCount++
		query += fmt.Sprintf(", profile_picture = $%d", paramCount)
		args = append(args, *input.ProfilePicture)
	}

	// Handle password update separately (needs hashing)
	if input.Password != nil && *input.Password != "" {
		hashedPassword, err := services.HashPassword(*input.Password)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not hash password"})
			return
		}
		paramCount++
		query += fmt.Sprintf(", password = $%d", paramCount)
		args = append(args, hashedPassword)
	}

	// Complete the query with the WHERE clause
	paramCount++
	query += fmt.Sprintf(" WHERE id = $%d RETURNING id", paramCount)
	args = append(args, userID)

	// Execute the update query
	var id string
	err := db.DB.QueryRow(query, args...).Scan(&id)
	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error: " + err.Error()})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "User profile updated successfully"})
}

// RefreshToken generates a new access token using a valid refresh token
func RefreshToken(c *gin.Context) {
	// Get refresh token from request body
	var input struct {
		RefreshToken string `json:"refresh_token" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Refresh token is required"})
		return
	}

	// Validate the refresh token
	userID, err := middlewares.ValidateRefreshToken(input.RefreshToken)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	// Generate a new access token
	accessToken, err := middlewares.GenerateJWT(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not generate access token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"token":      accessToken,
		"expires_in": int(middlewares.AccessTokenExpiration.Seconds()),
	})
}

// Logout invalidates a refresh token
func Logout(c *gin.Context) {
	// Get refresh token from request body
	var input struct {
		RefreshToken string `json:"refresh_token" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Refresh token is required"})
		return
	}

	// Invalidate the refresh token
	err := middlewares.InvalidateRefreshToken(input.RefreshToken)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not logout"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Successfully logged out"})
}
