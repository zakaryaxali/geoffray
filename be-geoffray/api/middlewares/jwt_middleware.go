package middlewares

import (
	"errors"
	"fmt"
	"net/http"
	"os"
	"strings"
	"time"

	"be-geoffray/db"
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
// Note: With Firebase authentication, refresh tokens are managed by Firebase
// This function now creates a JWT-based refresh token instead of storing in database
func GenerateRefreshToken(userID string) (string, error) {
	// Get user details from database
	var firstName, lastName, email string

	query := `SELECT first_name, last_name, email FROM users WHERE id = $1`
	err := db.DB.QueryRow(query, userID).Scan(&firstName, &lastName, &email)
	if err != nil {
		return "", fmt.Errorf("error fetching user details: %w", err)
	}

	expirationTime := time.Now().Add(RefreshTokenExpiration)
	claims := &Claims{
		UserID:    userID,
		FirstName: firstName,
		LastName:  lastName,
		Email:     email,
		Type:      "refresh",
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expirationTime),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(getJWTSecret())
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
// Note: With Firebase authentication, we now validate JWT-based refresh tokens
func ValidateRefreshToken(tokenString string) (string, error) {
	claims := &Claims{}

	token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
		return getJWTSecret(), nil
	})

	if err != nil {
		return "", fmt.Errorf("invalid refresh token: %w", err)
	}

	if !token.Valid {
		return "", errors.New("invalid refresh token")
	}

	// Ensure this is a refresh token, not an access token
	if claims.Type != "refresh" {
		return "", errors.New("invalid token type: expected refresh token")
	}

	return claims.UserID, nil
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
