package services

import (
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"

	"be-geoffray/db"
	"be-geoffray/models"
	"github.com/gin-gonic/gin"
)

// EventMessageService handles event message related operations
func GetEventMessages(c *gin.Context, eventID string) ([]models.EventMessage, error) {
	var messages []models.EventMessage

	// Use explicit column names instead of u.* to avoid potential schema issues
	query := `
		SELECT 
			m.id, 
			m.event_id, 
			m.user_id, 
			m.content, 
			m.parent_id, 
			m.created_at, 
			m.updated_at,
			m.is_agent_message,
			m.for_agent,
			u.id as user_id, 
			u.email, 
			u.first_name, 
			u.last_name, 
			u.profile_picture
		FROM event_messages m
		JOIN users u ON m.user_id = u.id
		WHERE m.event_id = $1
		ORDER BY m.created_at ASC
	`

	rows, err := db.DB.Query(query, eventID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var message models.EventMessage
		var parentID sql.NullString
		var userID string // Temporary variable to avoid overwriting message.UserID

		if err := rows.Scan(
			&message.ID,
			&message.EventID,
			&message.UserID,
			&message.Content,
			&parentID,
			&message.CreatedAt,
			&message.UpdatedAt,
			&message.IsAgentMessage,
			&message.ForAgent,
			&userID, // Scan into temporary variable
			&message.User.Email,
			&message.User.FirstName,
			&message.User.LastName,
			&message.User.ProfilePicture,
		); err != nil {
			return nil, err
		}

		// Set the user ID explicitly
		message.User.ID = userID

		if parentID.Valid {
			message.ParentID = &parentID.String
		}

		messages = append(messages, message)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return messages, nil
}

func CreateEventMessage(c *gin.Context, message *models.EventMessage) error {
	// Check if the message is for the agent
	message.ForAgent = IsMessageForAgent(message.Content)

	query := `
		INSERT INTO event_messages (id, event_id, user_id, content, parent_id, created_at, updated_at, is_agent_message, for_agent)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
	`

	_, err := db.DB.Exec(query,
		message.ID,
		message.EventID,
		message.UserID,
		message.Content,
		message.ParentID,
		message.CreatedAt,
		message.UpdatedAt,
		message.IsAgentMessage,
		message.ForAgent,
	)

	return err
}

// GetEventMessageThread retrieves a message and all its replies recursively
func GetEventMessageThread(eventID, messageID string) (*models.EventMessage, error) {
	// Implementation for getting a message thread
	return nil, errors.New("not implemented")
}

// IsMessageForAgent checks if a message is intended for the agent (contains @agent tag)
func IsMessageForAgent(content string) bool {
	return strings.Contains(content, "@agent")
}

// RemoveAgentTag removes the @agent tag from the message content
func RemoveAgentTag(content string) string {
	return strings.ReplaceAll(content, "@agent", "")
}

// GetAgentMessages retrieves all messages for a specific event that are either for the agent or from the agent
func GetAgentMessages(c *gin.Context, eventID string) ([]models.EventMessage, error) {
	var messages []models.EventMessage

	query := `
		SELECT 
			m.id, 
			m.event_id, 
			m.user_id, 
			m.content, 
			m.parent_id, 
			m.created_at, 
			m.updated_at,
			m.is_agent_message,
			m.for_agent,
			u.id as user_id, 
			u.email, 
			u.first_name, 
			u.last_name, 
			u.profile_picture
		FROM event_messages m
		JOIN users u ON m.user_id = u.id
		WHERE m.event_id = $1 AND (m.for_agent = TRUE OR m.is_agent_message = TRUE)
		ORDER BY m.created_at ASC
	`

	rows, err := db.DB.Query(query, eventID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var message models.EventMessage
		var parentID sql.NullString
		var userID string // Temporary variable to avoid overwriting message.UserID

		if err := rows.Scan(
			&message.ID,
			&message.EventID,
			&message.UserID,
			&message.Content,
			&parentID,
			&message.CreatedAt,
			&message.UpdatedAt,
			&message.IsAgentMessage,
			&message.ForAgent,
			&userID, // Scan into temporary variable
			&message.User.Email,
			&message.User.FirstName,
			&message.User.LastName,
			&message.User.ProfilePicture,
		); err != nil {
			return nil, err
		}

		// Set the user ID explicitly
		message.User.ID = userID

		if parentID.Valid {
			message.ParentID = &parentID.String
		}

		messages = append(messages, message)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return messages, nil
}

// ConvertEventMessagesToMistralMessages converts event messages to the Mistral message format
func ConvertEventMessagesToMistralMessages(messages []models.EventMessage) []MistralMessage {
	var mistralMessages []MistralMessage

	for _, msg := range messages {
		role := "user"
		if msg.IsAgentMessage {
			role = "assistant"
		}

		content := msg.Content
		if !msg.IsAgentMessage && msg.ForAgent {
			content = RemoveAgentTag(content)
		}

		mistralMessages = append(mistralMessages, MistralMessage{
			Role:    role,
			Content: content,
		})
	}

	return mistralMessages
}

// CreateAgentMessage creates a new message from the agent
func CreateAgentMessage(c *gin.Context, eventID string, content string, parentID *string) (*models.EventMessage, error) {
	// Create a system user for agent messages if it doesn't exist
	systemUser, err := GetOrCreateSystemUser(c)
	if err != nil {
		return nil, fmt.Errorf("failed to get or create system user: %v", err)
	}

	message := models.EventMessage{
		ID:             uuid.New().String(),
		EventID:        eventID,
		UserID:         systemUser.ID,
		Content:        content,
		ParentID:       parentID,
		CreatedAt:      time.Now(),
		UpdatedAt:      time.Now(),
		IsAgentMessage: true,
		ForAgent:       false,
		User:           *systemUser,
	}

	query := `
		INSERT INTO event_messages (id, event_id, user_id, content, parent_id, created_at, updated_at, is_agent_message, for_agent)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
	`

	_, err = db.DB.Exec(query,
		message.ID,
		message.EventID,
		message.UserID,
		message.Content,
		message.ParentID,
		message.CreatedAt,
		message.UpdatedAt,
		message.IsAgentMessage,
		message.ForAgent,
	)

	if err != nil {
		return nil, err
	}

	return &message, nil
}

// GetOrCreateSystemUser gets or creates a system user for agent messages
func GetOrCreateSystemUser(c *gin.Context) (*models.User, error) {
	// Check if system user exists
	var systemUser models.User

	query := `
		SELECT id, email, first_name, last_name, profile_picture
		FROM users
		WHERE email = 'agent@system.local'
	`

	err := db.DB.QueryRow(query).Scan(
		&systemUser.ID,
		&systemUser.Email,
		&systemUser.FirstName,
		&systemUser.LastName,
		&systemUser.ProfilePicture,
	)

	if err == nil {
		// User exists, return it
		return &systemUser, nil
	}

	if err != sql.ErrNoRows {
		// Unexpected error
		return nil, err
	}

	// User doesn't exist, create it
	systemUser = models.User{
		ID:             uuid.New().String(),
		Email:          "agent@system.local",
		FirstName:      "AI",
		LastName:       "Assistant",
		ProfilePicture: "/assets/images/ai-avatar.png",
	}

	insertQuery := `
		INSERT INTO users (id, email, first_name, last_name, profile_picture, password, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
	`

	_, err = db.DB.Exec(insertQuery,
		systemUser.ID,
		systemUser.Email,
		systemUser.FirstName,
		systemUser.LastName,
		systemUser.ProfilePicture,
		"SYSTEM_USER_NO_LOGIN", // Placeholder password hash
		time.Now(),
		time.Now(),
	)

	if err != nil {
		return nil, err
	}

	return &systemUser, nil
}

// GetEventByID retrieves an event by its ID
func GetEventByID(eventID string) (*models.Event, error) {
	var event models.Event
	eventQuery := `
		SELECT id, creator_id, title, description, start_date, end_date, banner, location, active, created_at, updated_at
		FROM events
		WHERE id = $1
	`
	err := db.DB.QueryRow(eventQuery, eventID).Scan(
		&event.ID, &event.CreatorID, &event.Title, &event.Description,
		&event.StartDate, &event.EndDate, &event.Banner, &event.Location, &event.Active,
		&event.CreatedAt, &event.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("error retrieving event data: %w", err)
	}
	return &event, nil
}

// ProcessAgentMessageWithMistral sends a message to Mistral AI and processes the response
func ProcessAgentMessageWithMistral(c *gin.Context, eventID string, messageID string) error {
	// Get all agent-related messages for context
	messages, err := GetAgentMessages(c, eventID)
	if err != nil {
		return fmt.Errorf("error getting agent messages: %w", err)
	}

	// Note: Event data retrieval removed as it's no longer needed after Amadeus removal

	// Convert event messages to Mistral format
	mistralMessages := ConvertEventMessagesToMistralMessages(messages)

	// Create Mistral service
	mistralService := NewMistralService()

	// Send the message (no function calling tools available)
	rawResp, err := mistralService.SendChatWithTools(mistralMessages, []interface{}{})
	fmt.Printf("[DEBUG] Raw Mistral API response: %s\n", string(rawResp))
	if err != nil {
		return fmt.Errorf("error from Mistral API: %w", err)
	}

	// Parse normal response and save (no function calling)
	var parsed struct {
		Choices []struct {
			Message struct {
				Content string `json:"content"`
			} `json:"message"`
		} `json:"choices"`
	}
	if err := json.Unmarshal([]byte(rawResp), &parsed); err != nil || len(parsed.Choices) == 0 {
		return fmt.Errorf("failed to parse Mistral response: %w", err)
	}
	aiResp := parsed.Choices[0].Message.Content
	fmt.Printf("[DEBUG] Saving normal AI message: '%s'\n", aiResp)
	_, err = CreateAgentMessage(c, eventID, aiResp, &messageID)
	if err != nil {
		return fmt.Errorf("error saving agent response: %w", err)
	}

	return nil
}

// Note: Flight-related function processing has been removed
