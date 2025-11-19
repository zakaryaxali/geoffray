package controllers

import (
	"crypto/rand"
	"database/sql"
	"encoding/hex"
	"log"
	"net/http"
	"regexp"
	"strings"
	"time"

	"be-geoffray/config"
	"be-geoffray/db"
	"be-geoffray/models"
	"be-geoffray/services"
	"github.com/gin-gonic/gin"
)

type CreateEventInput struct {
	Title       string     `json:"title" binding:"required"`
	Description string     `json:"description"`
	StartDate   time.Time  `json:"start_date" binding:"required"`
	EndDate     *time.Time `json:"end_date"`
	Banner      string     `json:"banner"`
	Location    string     `json:"location"`
}

// CreateEvent handles the creation of a new event
// Requires authentication
func CreateEvent(c *gin.Context) {
	// Get the user ID from the authenticated context
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	var input CreateEventInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Initialize the event service
	eventService := services.NewEventService()

	// Create the event using the service
	event, err := eventService.CreateEvent(
		userID.(string),
		input.Title,
		input.Description,
		input.StartDate,
		input.EndDate,
		input.Banner,
		input.Location,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Event created successfully",
		"event":   event,
	})
}

// Participant represents a user participating in an event
type Participant struct {
	ID        string `json:"id"`
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
	Status    string `json:"status"`
}

// EventWithParticipants combines event data with its participants
type EventWithParticipants struct {
	Event        models.Event  `json:"event"`
	Participants []Participant `json:"participants"`
}

// GetEventByID returns a single event by its ID along with its participants
// PendingInvitation represents an invitation that hasn't been accepted yet
type PendingInvitation struct {
	Email     *string   `json:"email"`
	InvitedAt time.Time `json:"invitedAt"`
	ExpiresAt time.Time `json:"expiresAt"`
}

func GetEventByID(c *gin.Context) {
	// Get the user ID from the authenticated context
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Get the event ID from the URL parameter
	eventID := c.Param("id")
	if eventID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Event ID is required"})
		return
	}

	// Initialize the event service
	eventService := services.NewEventService()

	// Get the event and participants using the service
	event, participants, err := eventService.GetEventByID(eventID, userID.(string))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	// Get pending invitations for this event
	pendingInvitations := []PendingInvitation{}
	query := `
		SELECT email, created_at, expires_at
		FROM event_invitations
		WHERE event_id = $1
		AND status = 'pending'
		ORDER BY created_at DESC
	`

	rows, err := db.DB.Query(query, eventID)
	if err != nil {
		log.Printf("Error fetching pending invitations: %v", err)
		// Continue without invitations if there's an error
	} else {
		defer rows.Close()

		for rows.Next() {
			var invitation PendingInvitation
			if err := rows.Scan(&invitation.Email, &invitation.InvitedAt, &invitation.ExpiresAt); err != nil {
				log.Printf("Error scanning invitation: %v", err)
				continue
			}
			pendingInvitations = append(pendingInvitations, invitation)
		}
	}

	// Return the event with participants and pending invitations
	c.JSON(http.StatusOK, gin.H{
		"event":              event,
		"participants":       participants,
		"pendingInvitations": pendingInvitations,
	})
}

// InviteParticipantInput represents the request body for inviting a participant
type InviteParticipantInput struct {
	Identifier string `json:"identifier" binding:"required"`
	Type       string `json:"type" binding:"required,oneof=email"`
}

// InviteParticipantResponse represents the response for the invite participant endpoint
type InviteParticipantResponse struct {
	Success    bool   `json:"success"`
	Message    string `json:"message"`
	UserExists bool   `json:"userExists"`
	InviteLink string `json:"inviteLink,omitempty"`
}

// generateInviteCode creates a random code for invitation links
func generateInviteCode() string {
	bytes := make([]byte, 4) // 8 hex characters
	rand.Read(bytes)
	return hex.EncodeToString(bytes)
}

// InviteParticipant handles inviting a participant to an event
// If the user exists, they are added as a participant
// If the user doesn't exist, an invitation is created
func InviteParticipant(c *gin.Context) {
	// Get the user ID from the authenticated context
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Get the event ID from the URL parameter
	eventID := c.Param("id")
	if eventID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Event ID is required"})
		return
	}

	// Verify that the event exists and the user has permission to invite
	var creatorID string
	eventQuery := `SELECT creator_id FROM events WHERE id = $1`
	err := db.DB.QueryRow(eventQuery, eventID).Scan(&creatorID)
	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"error": "Event not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to verify event"})
		}
		return
	}

	// Only the creator can invite participants for now
	// This could be expanded to allow participants to invite others
	if creatorID != userID.(string) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only the event creator can invite participants"})
		return
	}

	// Parse the request body
	var input InviteParticipantInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Clean the identifier
	input.Identifier = strings.TrimSpace(input.Identifier)

	// Validate the identifier (email only)
	if input.Type == "email" {
		// Simple email validation
		emailRegex := regexp.MustCompile(`^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$`)
		if !emailRegex.MatchString(input.Identifier) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid email format"})
			return
		}
	}

	// Check if a user with this email exists
	var existingUserID string
	userQuery := `SELECT id FROM users WHERE email = $1`

	err = db.DB.QueryRow(userQuery, input.Identifier).Scan(&existingUserID)

	// If the user exists
	if err == nil {
		// Check if they're already a participant
		var participantExists int
		participantQuery := `SELECT 1 FROM event_participants WHERE event_id = $1 AND user_id = $2 LIMIT 1`
		err = db.DB.QueryRow(participantQuery, eventID, existingUserID).Scan(&participantExists)

		if err == nil {
			// User is already a participant
			c.JSON(http.StatusOK, InviteParticipantResponse{
				Success:    true,
				Message:    "User is already a participant",
				UserExists: true,
			})
			return
		}

		// Add the user as a participant with 'pending' status
		_, err = db.DB.Exec(`INSERT INTO event_participants (event_id, user_id, status) VALUES ($1, $2, $3)`, eventID, existingUserID, "pending")
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to add participant"})
			return
		}

		// Update the participants count in the events table
		_, err = db.DB.Exec(`
			UPDATE events 
			SET participants_count = (
				SELECT COUNT(*) FROM event_participants 
				WHERE event_id = $1 AND (status = 'accepted' OR status = 'pending' OR status = 'going')
			) 
			WHERE id = $1`, eventID)
		if err != nil {
			log.Printf("Warning: Failed to update participants count for event %s: %v", eventID, err)
			// Don't fail the request, just log the warning
		}

		c.JSON(http.StatusOK, InviteParticipantResponse{
			Success:    true,
			Message:    "Participant added successfully",
			UserExists: true,
		})
		return
	}

	// User doesn't exist, check if there's already a pending invitation
	var existingInviteCode string
	invitationCheckQuery := `
		SELECT invite_code FROM event_invitations
		WHERE event_id = $1
		AND email = $2
		AND status = 'pending'
		LIMIT 1
	`
	err = db.DB.QueryRow(invitationCheckQuery, eventID, input.Identifier).Scan(&existingInviteCode)

	if err == nil {
		// Invitation already exists, return the existing invite link
		appConfig := config.GetConfig()
		existingInviteLink := appConfig.FrontendURL + "/invite/" + existingInviteCode

		c.JSON(http.StatusOK, InviteParticipantResponse{
			Success:    true,
			Message:    "An invitation has already been sent to this email",
			UserExists: false,
			InviteLink: existingInviteLink,
		})
		return
	}

	// No existing invitation, create a new one
	inviteCode := generateInviteCode()
	// Set expiration to far future (100 years - effectively no expiration)
	expiresAt := time.Now().AddDate(100, 0, 0)

	// Create the invitation record
	inviteQuery := `
		INSERT INTO event_invitations
		(event_id, email, invite_code, status, expires_at, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id
	`

	var invitationID string
	now := time.Now()
	err = db.DB.QueryRow(
		inviteQuery,
		eventID,
		input.Identifier,
		inviteCode,
		"pending",
		expiresAt,
		now,
		now,
	).Scan(&invitationID)

	if err != nil {
		log.Println("Error creating invitation:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create invitation"})
		return
	}

	// Generate the invite link using the AppConfig
	appConfig := config.GetConfig()
	inviteLink := appConfig.FrontendURL + "/invite/" + inviteCode

	c.JSON(http.StatusOK, InviteParticipantResponse{
		Success:    true,
		Message:    "Invitation created successfully",
		UserExists: false,
		InviteLink: inviteLink,
	})
}

// RescindInvitation deletes a pending invitation
func RescindInvitation(c *gin.Context) {
	// Get the user ID from the authenticated context
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Get the event ID and email from URL parameters
	eventID := c.Param("id")
	email := c.Param("email")

	if eventID == "" || email == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Event ID and email are required"})
		return
	}

	// Verify that the event exists and the user is the creator
	var creatorID string
	eventQuery := `SELECT creator_id FROM events WHERE id = $1`
	err := db.DB.QueryRow(eventQuery, eventID).Scan(&creatorID)
	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"error": "Event not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to verify event"})
		}
		return
	}

	// Only the creator can rescind invitations
	if creatorID != userID.(string) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only the event creator can rescind invitations"})
		return
	}

	// Delete the invitation
	deleteQuery := `
		DELETE FROM event_invitations
		WHERE event_id = $1 AND email = $2 AND status = 'pending'
	`
	result, err := db.DB.Exec(deleteQuery, eventID, email)
	if err != nil {
		log.Printf("Error deleting invitation: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete invitation"})
		return
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Invitation not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Invitation rescinded successfully",
	})
}

// GetUserEvents returns all events where the user is either the creator or a participant
func GetUserEvents(c *gin.Context) {
	// Get the user ID from the authenticated context
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Initialize the event service
	eventService := services.NewEventService()

	// Get the user's events using the service
	events, err := eventService.GetUserEvents(userID.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"events": events})
}
