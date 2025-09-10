package controllers

import (
	"database/sql"
	"errors"
	"fmt"
	"net/http"
	"regexp"
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

	// Validate phone number if provided
	if input.CountryCode != "" || input.PhoneNumber != "" {
		if err := validatePhoneNumber(input.CountryCode, input.PhoneNumber); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
	}

	// Hash password
	hashedPassword, err := services.HashPassword(input.Password)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not hash password"})
		return
	}

	input.Password = hashedPassword

	// Save user to DB
	query := `INSERT INTO users (first_name, last_name, email, password, profile_picture, country_code, phone_number, created_at, updated_at) 
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`

	now := time.Now()
	_, err = db.DB.Exec(
		query,
		input.FirstName,
		input.LastName,
		input.Email,
		input.Password,
		input.ProfilePicture,
		input.CountryCode,
		input.PhoneNumber,
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

// validatePhoneNumber checks if the phone number is valid
func validatePhoneNumber(countryCode, phoneNumber string) error {
	// Check if both country code and phone number are provided or both are empty
	if (countryCode == "" && phoneNumber != "") || (countryCode != "" && phoneNumber == "") {
		return errors.New("both country code and phone number must be provided together")
	}

	// If both are empty, that's valid (phone is optional)
	if countryCode == "" && phoneNumber == "" {
		return nil
	}

	// Validate country code format (should start with + followed by 1-3 digits)
	countryCodePattern := regexp.MustCompile(`^\+[1-9]\d{0,2}$`)
	if !countryCodePattern.MatchString(countryCode) {
		return errors.New("invalid country code format, should be like +1, +44, etc")
	}

	// Validate phone number (digits only, reasonable length)
	phonePattern := regexp.MustCompile(`^\d{6,15}$`)
	if !phonePattern.MatchString(phoneNumber) {
		return errors.New("phone number should contain 6-15 digits only")
	}

	// Additional validation could be added here for specific country formats

	return nil
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
	query := `SELECT id, first_name, last_name, email, profile_picture, country_code, phone_number, created_at, updated_at 
          FROM users WHERE id = $1`

	err := db.DB.QueryRow(query, userID).Scan(
		&user.ID,
		&user.FirstName,
		&user.LastName,
		&user.Email,
		&user.ProfilePicture,
		&user.CountryCode,
		&user.PhoneNumber,
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
		CountryCode    *string `json:"country_code,omitempty"`
		PhoneNumber    *string `json:"phone_number,omitempty"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validate phone number if provided
	if (input.CountryCode != nil && input.PhoneNumber == nil) || (input.CountryCode == nil && input.PhoneNumber != nil) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Both country code and phone number must be provided together"})
		return
	}

	if input.CountryCode != nil && input.PhoneNumber != nil {
		if err := validatePhoneNumber(*input.CountryCode, *input.PhoneNumber); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
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

	// Add phone number fields if provided
	if input.CountryCode != nil {
		paramCount++
		query += fmt.Sprintf(", country_code = $%d", paramCount)
		args = append(args, *input.CountryCode)
	}

	if input.PhoneNumber != nil {
		paramCount++
		query += fmt.Sprintf(", phone_number = $%d", paramCount)
		args = append(args, *input.PhoneNumber)
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
