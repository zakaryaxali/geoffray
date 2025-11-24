package controllers

import (
	"database/sql"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

type InviteController struct {
	db *sql.DB
}

func NewInviteController(db *sql.DB) *InviteController {
	return &InviteController{db: db}
}

// ValidateInvite validates an invite code and returns event details
// GET /invites/:code
func (ic *InviteController) ValidateInvite(c *gin.Context) {
	code := c.Param("code")

	var invite struct {
		ID               string
		EventID          string
		Email            sql.NullString
		Status           string
		ExpiresAt        time.Time
		EventTitle       string
		EventDescription sql.NullString
	}

	query := `
		SELECT
			ei.id,
			ei.event_id,
			ei.email,
			ei.status,
			ei.expires_at,
			e.title,
			e.description
		FROM event_invitations ei
		JOIN events e ON e.id = ei.event_id
		WHERE ei.invite_code = $1
	`

	err := ic.db.QueryRow(query, code).Scan(
		&invite.ID,
		&invite.EventID,
		&invite.Email,
		&invite.Status,
		&invite.ExpiresAt,
		&invite.EventTitle,
		&invite.EventDescription,
	)

	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"error": "Invite not found"})
		return
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to validate invite"})
		return
	}

	// Check if invite is expired
	if time.Now().After(invite.ExpiresAt) {
		c.JSON(http.StatusGone, gin.H{
			"error": "Invite has expired",
			"valid": false,
		})
		return
	}

	// Check if already accepted
	if invite.Status == "accepted" {
		c.JSON(http.StatusOK, gin.H{
			"valid":       false,
			"message":     "Invite already accepted",
			"event_id":    invite.EventID,
			"event_title": invite.EventTitle,
		})
		return
	}

	// Return valid invite details
	response := gin.H{
		"valid":         true,
		"event_id":      invite.EventID,
		"event_title":   invite.EventTitle,
		"invited_email": invite.Email.String,
	}

	if invite.EventDescription.Valid {
		response["event_description"] = invite.EventDescription.String
	}

	c.JSON(http.StatusOK, response)
}

// AcceptInvite accepts an invitation and adds user to event
// POST /invites/:code/accept
func (ic *InviteController) AcceptInvite(c *gin.Context) {
	code := c.Param("code")
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Get user email
	var userEmail string
	err := ic.db.QueryRow("SELECT email FROM users WHERE id = $1", userID).Scan(&userEmail)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get user details"})
		return
	}

	// Get invitation details
	var invite struct {
		ID        string
		EventID   string
		Email     sql.NullString
		Status    string
		ExpiresAt time.Time
	}

	query := `
		SELECT id, event_id, email, status, expires_at
		FROM event_invitations
		WHERE invite_code = $1
	`

	err = ic.db.QueryRow(query, code).Scan(
		&invite.ID,
		&invite.EventID,
		&invite.Email,
		&invite.Status,
		&invite.ExpiresAt,
	)

	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"error": "Invite not found"})
		return
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve invite"})
		return
	}

	// Check if expired
	if time.Now().After(invite.ExpiresAt) {
		c.JSON(http.StatusGone, gin.H{"error": "Invite has expired"})
		return
	}

	// Check if already accepted
	if invite.Status == "accepted" {
		c.JSON(http.StatusConflict, gin.H{"error": "Invite already accepted"})
		return
	}

	// Validate email matches
	if invite.Email.Valid && invite.Email.String != userEmail {
		c.JSON(http.StatusForbidden, gin.H{
			"error":         "This invite was sent to a different email address",
			"invited_email": invite.Email.String,
			"your_email":    userEmail,
		})
		return
	}

	// Check if user is already a participant
	var existingParticipant bool
	err = ic.db.QueryRow(
		"SELECT EXISTS(SELECT 1 FROM event_participants WHERE event_id = $1 AND user_id = $2)",
		invite.EventID,
		userID,
	).Scan(&existingParticipant)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check participation status"})
		return
	}

	if existingParticipant {
		c.JSON(http.StatusConflict, gin.H{
			"error":    "You are already a participant in this event",
			"event_id": invite.EventID,
		})
		return
	}

	// Begin transaction
	tx, err := ic.db.Begin()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to start transaction"})
		return
	}
	defer tx.Rollback()

	// Add user as participant
	_, err = tx.Exec(
		"INSERT INTO event_participants (event_id, user_id, status) VALUES ($1, $2, $3)",
		invite.EventID,
		userID,
		"going",
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to add participant"})
		return
	}

	// Update invitation status
	_, err = tx.Exec(
		"UPDATE event_invitations SET status = $1, updated_at = $2 WHERE id = $3",
		"accepted",
		time.Now(),
		invite.ID,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update invitation"})
		return
	}

	// Update event participants count
	_, err = tx.Exec(
		"UPDATE events SET participants_count = participants_count + 1, updated_at = $1 WHERE id = $2",
		time.Now(),
		invite.EventID,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update event"})
		return
	}

	// Commit transaction
	if err = tx.Commit(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to commit transaction"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":  "Successfully joined event",
		"event_id": invite.EventID,
	})
}
