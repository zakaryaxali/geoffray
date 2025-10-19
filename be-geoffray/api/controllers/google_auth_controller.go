package controllers

import (
	"context"
	"database/sql"
	"encoding/base64"
	"fmt"
	"net/http"
	"os"
	"strings"
	"time"

	"be-geoffray/api/middlewares"
	"be-geoffray/db"
	"be-geoffray/models"

	firebase "firebase.google.com/go/v4"
	"firebase.google.com/go/v4/auth"
	"github.com/gin-gonic/gin"
	"google.golang.org/api/option"
)

type FirebaseLoginRequest struct {
	IDToken      string `json:"idToken" binding:"required"`
	AuthProvider string `json:"authProvider"`
	FirstName    string `json:"firstName,omitempty"`
	LastName     string `json:"lastName,omitempty"`
}

// Firebase Admin SDK variables
var firebaseApp *firebase.App
var firebaseAuth *auth.Client

// InitializeFirebase initializes Firebase Admin SDK after environment variables are loaded
func InitializeFirebase() {
	ctx := context.Background()

	// Get base64 encoded service account from environment
	serviceAccountBase64 := os.Getenv("FIREBASE_SERVICE_ACCOUNT_BASE64")
	if serviceAccountBase64 == "" {
		fmt.Println("Warning: FIREBASE_SERVICE_ACCOUNT_BASE64 not found in environment")
		fmt.Println("Firebase authentication will not be available")
		return
	}

	// Decode base64 service account
	serviceAccountJSON, err := base64.StdEncoding.DecodeString(serviceAccountBase64)
	if err != nil {
		fmt.Printf("Warning: Error decoding Firebase service account: %v\n", err)
		fmt.Println("Firebase authentication will not be available")
		return
	}

	// Initialize Firebase with service account credentials
	conf := &firebase.Config{
		ProjectID: "geoffray-f341d",
	}

	opt := option.WithCredentialsJSON(serviceAccountJSON)
	app, err := firebase.NewApp(ctx, conf, opt)
	if err != nil {
		fmt.Printf("Warning: Error initializing Firebase app: %v\n", err)
		fmt.Println("Firebase authentication will not be available")
		return
	}

	authClient, err := app.Auth(ctx)
	if err != nil {
		fmt.Printf("Warning: Error getting Auth client: %v\n", err)
		fmt.Println("Firebase authentication will not be available")
		return
	}

	firebaseApp = app
	firebaseAuth = authClient
	fmt.Println("Firebase Admin SDK initialized successfully")
}

func FirebaseLogin(c *gin.Context) {
	var input FirebaseLoginRequest
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request: " + err.Error()})
		return
	}

	if firebaseAuth == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Firebase not initialized"})
		return
	}

	// Verify the Firebase ID token
	ctx := context.Background()
	token, err := firebaseAuth.VerifyIDToken(ctx, input.IDToken)
	if err != nil {
		fmt.Printf("Firebase token verification error: %v\n", err)
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid Firebase ID token"})
		return
	}

	// Extract user info from the token
	firebaseUID := token.UID
	email := ""
	name := ""
	picture := ""

	// Get email from claims
	if emailClaim, ok := token.Claims["email"]; ok {
		email, _ = emailClaim.(string)
	}

	// Get name from claims
	if nameClaim, ok := token.Claims["name"]; ok {
		name, _ = nameClaim.(string)
	}

	// Get picture from claims
	if pictureClaim, ok := token.Claims["picture"]; ok {
		picture, _ = pictureClaim.(string)
	}

	// Check if email is verified for email/password auth
	if input.AuthProvider == "firebase" {
		if emailVerifiedClaim, ok := token.Claims["email_verified"]; ok {
			if emailVerified, ok := emailVerifiedClaim.(bool); !ok || !emailVerified {
				// For Firebase email/password, we might skip this check or handle differently
				// Firebase email verification is optional
			}
		}
	}

	// Check if user exists by Firebase UID or email
	var user models.User
	var userExists bool

	// First, try to find by Firebase UID
	queryByUID := `SELECT id, first_name, last_name, email, firebase_uid, profile_picture_url 
	                FROM users WHERE firebase_uid = $1`
	err = db.DB.QueryRow(queryByUID, firebaseUID).Scan(
		&user.ID,
		&user.FirstName,
		&user.LastName,
		&user.Email,
		&sql.NullString{}, // firebase_uid
		&sql.NullString{}, // profile_picture_url
	)

	if err == sql.ErrNoRows {
		// Try to find by email
		queryByEmail := `SELECT id, first_name, last_name, email, firebase_uid, profile_picture_url 
		                 FROM users WHERE email = $1`
		err = db.DB.QueryRow(queryByEmail, email).Scan(
			&user.ID,
			&user.FirstName,
			&user.LastName,
			&user.Email,
			&sql.NullString{},
			&sql.NullString{},
		)

		if err == sql.ErrNoRows {
			// User doesn't exist, create new one
			userExists = false
		} else if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error: " + err.Error()})
			return
		} else {
			// User exists by email, update with Firebase UID
			userExists = true
			updateQuery := `UPDATE users SET firebase_uid = $1, profile_picture_url = $2 
			               WHERE id = $3`
			_, err = db.DB.Exec(updateQuery, firebaseUID, picture, user.ID)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update user with Firebase info"})
				return
			}
		}
	} else if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error: " + err.Error()})
		return
	} else {
		userExists = true
		// Update profile picture if changed
		if picture != "" {
			updatePicture := `UPDATE users SET profile_picture_url = $1 WHERE id = $2`
			db.DB.Exec(updatePicture, picture, user.ID)
		}
	}

	// Create new user if doesn't exist
	if !userExists {
		// Use names from request for signup, or parse from token
		firstName := input.FirstName
		lastName := input.LastName

		if firstName == "" || lastName == "" {
			// Fallback to parsing name from token
			if name != "" {
				nameParts := strings.SplitN(name, " ", 2)
				if firstName == "" {
					firstName = nameParts[0]
				}
				if lastName == "" && len(nameParts) > 1 {
					lastName = nameParts[1]
				}
			}
		}

		insertQuery := `INSERT INTO users (first_name, last_name, email, firebase_uid, profile_picture_url, created_at, updated_at) 
		               VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`

		now := time.Now()
		err = db.DB.QueryRow(
			insertQuery,
			firstName,
			lastName,
			email,
			firebaseUID,
			picture,
			now,
			now,
		).Scan(&user.ID)

		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user: " + err.Error()})
			return
		}

		user.FirstName = firstName
		user.LastName = lastName
		user.Email = email
	}

	// Generate JWT tokens
	tokenResponse, err := middlewares.GenerateTokenPair(user.ID)
	if err != nil {
		fmt.Printf("Token generation error: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not generate tokens: " + err.Error()})
		return
	}

	// Create response with user info
	response := gin.H{
		"token":         tokenResponse.Token,
		"refresh_token": tokenResponse.RefreshToken,
		"expires_in":    tokenResponse.ExpiresIn,
		"user": gin.H{
			"id":         user.ID,
			"email":      user.Email,
			"first_name": user.FirstName,
			"last_name":  user.LastName,
		},
	}

	c.JSON(http.StatusOK, response)
}
