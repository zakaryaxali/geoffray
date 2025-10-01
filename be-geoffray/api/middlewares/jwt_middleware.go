package middlewares

import (
	"database/sql"
	"errors"
	"fmt"
	"net/http"
	"os"
	"strings"
	"time"

	"be-geoffray/db"
	"be-geoffray/models"
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

// Token expiration times
const (
	AccessTokenExpiration  = 24 * time.Hour
	RefreshTokenExpiration = 7 * 24 * time.Hour // 7 days
)

// Claims structure
type Claims struct {
	UserID    string `json:"user_id"`
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
	Email     string `json:"email"`
	Type      string `json:"token_type"` // "access" or "refresh"
	jwt.RegisteredClaims
}

// TokenResponse represents the response for token operations
type TokenResponse struct {
	Token        string `json:"token"`
	RefreshToken string `json:"refresh_token,omitempty"`
	ExpiresIn    int    `json:"expires_in"` // Expiration in seconds
}

// getJWTSecret gets the JWT secret from environment variables
func getJWTSecret() []byte {
	return []byte(os.Getenv("JWT_SECRET"))
}

// GenerateJWT creates a new short-lived JWT access token
func GenerateJWT(userID string) (string, error) {
	// Get user details from database
	var firstName, lastName, email string

	query := `SELECT first_name, last_name, email FROM users WHERE id = $1`
	err := db.DB.QueryRow(query, userID).Scan(&firstName, &lastName, &email)
	if err != nil {
		return "", fmt.Errorf("error fetching user details: %w", err)
	}

	expirationTime := time.Now().Add(AccessTokenExpiration)
	claims := &Claims{
		UserID:    userID,
		FirstName: firstName,
		LastName:  lastName,
		Email:     email,
		Type:      "access",
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expirationTime),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(getJWTSecret())
}

// GenerateRefreshToken creates a new long-lived refresh token
func GenerateRefreshToken(userID string) (string, error) {
	// Generate a secure random token
	tokenString, err := models.GenerateToken(32)
	if err != nil {
		return "", fmt.Errorf("token generation error: %w", err)
	}

	// Store the refresh token in the database
	expirationTime := time.Now().Add(RefreshTokenExpiration)

	// Create a UUID for the token
	query := `INSERT INTO refresh_tokens (id, user_id, token, expires_at, created_at) 
			VALUES (uuid_generate_v4(), $1, $2, $3, $4) RETURNING id`

	var tokenID string
	err = db.DB.QueryRow(query, userID, tokenString, expirationTime, time.Now()).Scan(&tokenID)
	if err != nil {
		return "", fmt.Errorf("database error: %w", err)
	}

	return tokenString, nil
}

// GenerateTokenPair creates both access and refresh tokens
func GenerateTokenPair(userID string) (TokenResponse, error) {
	// Generate access token
	accessToken, err := GenerateJWT(userID)
	if err != nil {
		return TokenResponse{}, err
	}

	// Generate refresh token
	refreshToken, err := GenerateRefreshToken(userID)
	if err != nil {
		return TokenResponse{}, err
	}

	return TokenResponse{
		Token:        accessToken,
		RefreshToken: refreshToken,
		ExpiresIn:    int(AccessTokenExpiration.Seconds()),
	}, nil
}

// ValidateRefreshToken checks if a refresh token is valid and returns the user ID
func ValidateRefreshToken(tokenString string) (string, error) {
	// Find the token in the database
	query := `SELECT user_id, expires_at FROM refresh_tokens WHERE token = $1`
	var userID string
	var expiresAt time.Time

	err := db.DB.QueryRow(query, tokenString).Scan(&userID, &expiresAt)
	if err != nil {
		if err == sql.ErrNoRows {
			return "", errors.New("invalid refresh token")
		}
		return "", err
	}

	// Check if the token has expired
	if time.Now().After(expiresAt) {
		// Delete the expired token
		_, _ = db.DB.Exec("DELETE FROM refresh_tokens WHERE token = $1", tokenString)
		return "", errors.New("refresh token expired")
	}

	return userID, nil
}

// InvalidateRefreshToken removes a refresh token from the database
func InvalidateRefreshToken(tokenString string) error {
	_, err := db.DB.Exec("DELETE FROM refresh_tokens WHERE token = $1", tokenString)
	return err
}

// JWTAuthMiddleware checks the JWT token in the request
func JWTAuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization token required"})
			c.Abort()
			return
		}

		tokenString := strings.TrimPrefix(authHeader, "Bearer ")
		claims := &Claims{}

		token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
			return getJWTSecret(), nil
		})

		if err != nil || !token.Valid {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired token"})
			c.Abort()
			return
		}

		// Ensure this is an access token, not a refresh token
		if claims.Type != "access" && claims.Type != "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token type"})
			c.Abort()
			return
		}

		// Store user ID in context for later use
		c.Set("user_id", claims.UserID)
		c.Next()
	}
}
