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

	// Get event data to use for flight date parameters
	event, err := GetEventByID(eventID)
	// Continue even if event data can't be retrieved - not a critical error
	var eventData *models.Event
	if err == nil {
		eventData = event
	} else {
		fmt.Printf("Warning: %v\n", err)
	}

	// Convert event messages to Mistral format
	mistralMessages := ConvertEventMessagesToMistralMessages(messages)

	// Create Mistral service
	mistralService := NewMistralService()

	// Send the message with tool schemas (for function calling)
	rawResp, err := mistralService.SendChatWithTools(mistralMessages, []interface{}{
		FlightInspirationToolSchema,
		FlightCheapestDatesToolSchema,
	})
	fmt.Printf("[DEBUG] Raw Mistral API response: %s\n", string(rawResp))
	if err != nil {
		return fmt.Errorf("error from Mistral API: %w", err)
	}

	// Check for function call in response
	funcName, funcArgs, toolCallID, found, err := DetectFunctionCall([]byte(rawResp))
	fmt.Printf("[DEBUG] Function call detected: found=%v, name=%s, args=%v, toolCallID=%s, err=%v\n", found, funcName, funcArgs, toolCallID, err)
	if err != nil {
		return fmt.Errorf("error parsing function call: %w", err)
	}

	if found && (funcName == "search_flights" || funcName == "search_flight_dates") {
		// Process flight-related function calls
		return ProcessFlightFunctionCall(
			c,
			eventID,
			messageID,
			mistralMessages,
			mistralService,
			string(rawResp),
			funcName,
			funcArgs,
			toolCallID,
			eventData,
		)
	}

	// Otherwise, parse normal response and save
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

// ProcessFlightFunctionCall handles flight-related function calls from Mistral
func ProcessFlightFunctionCall(
	c *gin.Context,
	eventID string,
	messageID string,
	mistralMessages []MistralMessage,
	mistralService *MistralService,
	rawResp string,
	funcName string,
	funcArgs map[string]interface{},
	toolCallID string,
	event *models.Event,
) error {
	var flightResults string

	if funcName == "search_flights" {
		results, err := ProcessFlightInspirationCall(funcArgs, event)
		if err != nil {
			return err
		}
		flightResults = results
	} else if funcName == "search_flight_dates" {
		results, err := ProcessFlightDatesCall(funcArgs, event)
		if err != nil {
			return err
		}
		flightResults = results
	}

	// Extract the tool calls from Mistral's response
	toolCalls, toolCallsFound := ExtractToolCalls([]byte(rawResp))
	if !toolCallsFound {
		return fmt.Errorf("failed to extract tool calls from response")
	}

	// Create the assistant message with the exact tool calls from Mistral's response
	assistantToolCallMsg := map[string]interface{}{
		"role":       "assistant",
		"content":    "", // Empty content for tool calls
		"tool_calls": toolCalls,
	}

	// Debug log
	fmt.Printf("[DEBUG] Adding assistant message with tool calls: %+v\n", assistantToolCallMsg)

	// Create a tool response message to send back to Mistral
	toolResponseMsg := MistralMessage{
		Role:       "tool",
		Name:       funcName,
		Content:    flightResults,
		ToolCallID: toolCallID,
	}

	// Debug log for tool response
	fmt.Printf("[DEBUG] Tool response: %+v\n", toolResponseMsg)

	// Convert the existing messages to a generic format for flexibility
	var updatedMessagesRaw []map[string]interface{}
	for _, msg := range mistralMessages {
		updatedMessagesRaw = append(updatedMessagesRaw, map[string]interface{}{
			"role":    msg.Role,
			"content": msg.Content,
		})
	}

	// Add the assistant tool call message
	updatedMessagesRaw = append(updatedMessagesRaw, assistantToolCallMsg)

	// Add the tool response message
	updatedMessagesRaw = append(updatedMessagesRaw, map[string]interface{}{
		"role":         "tool",
		"name":         funcName,
		"content":      flightResults,
		"tool_call_id": toolCallID,
	})

	// Get final response from the agent
	finalResponse, err := mistralService.SendChatRaw(updatedMessagesRaw)
	if err != nil {
		return fmt.Errorf("failed to get final response: %w", err)
	}

	// Save the final AI response
	_, err = CreateAgentMessage(c, eventID, finalResponse, &messageID)
	if err != nil {
		return fmt.Errorf("failed to save AI response: %w", err)
	}

	return nil
}

// ProcessFlightInspirationCall processes the flight inspiration function call
func ProcessFlightInspirationCall(funcArgs map[string]interface{}, event *models.Event) (string, error) {
	// Extract parameters for flight inspiration
	origin, ok := funcArgs["origin"].(string)
	if !ok || origin == "" {
		return "", fmt.Errorf("missing origin parameter for flight search")
	}

	// Extract departure date if provided, or use event start date
	departureDate := ""
	if dd, ok := funcArgs["departureDate"].(string); ok && dd != "" {
		// User or agent explicitly provided a departure date
		departureDate = dd
	} else if event != nil && !event.StartDate.IsZero() {
		// Use event start date if available
		departureDate = event.StartDate.Format("2006-01-02")
		fmt.Printf("[DEBUG] Using event start date for departure: %s\n", departureDate)
	}

	// Extract max price if provided
	var maxPricePtr *int
	if mp, ok := funcArgs["maxPrice"]; ok {
		switch v := mp.(type) {
		case float64:
			vInt := int(v)
			maxPricePtr = &vInt
		case int:
			maxPricePtr = &v
		}
	}

	// Extract oneWay parameter if provided
	var oneWayPtr *bool
	if ow, ok := funcArgs["oneWay"].(bool); ok {
		oneWayPtr = &ow
	}

	// Extract nonStop parameter if provided
	var nonStopPtr *bool
	if ns, ok := funcArgs["nonStop"].(bool); ok {
		nonStopPtr = &ns
	}

	// Call flight inspiration service with all parameters
	flights, err := GetFlightInspiration(origin, departureDate, maxPricePtr, oneWayPtr, nonStopPtr)
	fmt.Printf("[DEBUG] Flight inspiration service returned: %+v, err=%v\n", flights, err)
	if err != nil {
		return "", fmt.Errorf("flight search failed: %w", err)
	}

	// Format flight results in a user-friendly way
	return FormatFlightsForDisplay(flights), nil
}

// ProcessFlightDatesCall processes the flight dates function call
func ProcessFlightDatesCall(funcArgs map[string]interface{}, event *models.Event) (string, error) {
	// Extract parameters for flight dates
	origin, ok := funcArgs["origin"].(string)
	if !ok || origin == "" {
		return "", fmt.Errorf("missing origin parameter for flight dates search")
	}

	destination, ok := funcArgs["destination"].(string)
	if !ok || destination == "" {
		return "", fmt.Errorf("missing destination parameter for flight dates search")
	}

	// Extract departure date if provided, or use event start date
	departureDate := ""
	if dd, ok := funcArgs["departureDate"].(string); ok && dd != "" {
		// User or agent explicitly provided a departure date
		departureDate = dd
	} else if event != nil && !event.StartDate.IsZero() {
		// Use event start date if available
		departureDate = event.StartDate.Format("2006-01-02")
		fmt.Printf("[DEBUG] Using event start date for departure: %s\n", departureDate)
	}

	// Extract duration if provided, or calculate from event dates
	var durationPtr *int
	if dur, ok := funcArgs["duration"]; ok {
		// User or agent explicitly provided a duration
		switch v := dur.(type) {
		case float64:
			vInt := int(v)
			durationPtr = &vInt
		case int:
			durationPtr = &v
		}
	} else if event != nil && !event.StartDate.IsZero() && event.EndDate != nil && !event.EndDate.IsZero() {
		// Calculate duration from event start and end dates
		duration := int(event.EndDate.Sub(event.StartDate).Hours() / 24)
		if duration > 0 {
			durationPtr = &duration
			fmt.Printf("[DEBUG] Using calculated duration from event dates: %d days\n", duration)
		}
	}

	// Extract max price if provided
	var maxPricePtr *int
	if mp, ok := funcArgs["maxPrice"]; ok {
		switch v := mp.(type) {
		case float64:
			vInt := int(v)
			maxPricePtr = &vInt
		case int:
			maxPricePtr = &v
		}
	}

	// Extract oneWay parameter if provided
	var oneWayPtr *bool
	if ow, ok := funcArgs["oneWay"].(bool); ok {
		oneWayPtr = &ow
	}

	// Extract nonStop parameter if provided
	var nonStopPtr *bool
	if ns, ok := funcArgs["nonStop"].(bool); ok {
		nonStopPtr = &ns
	}

	// Call flight dates service
	flightDates, err := GetFlightCheapestDates(origin, destination, departureDate, durationPtr, maxPricePtr, oneWayPtr, nonStopPtr)
	fmt.Printf("[DEBUG] Flight dates service returned: %+v, err=%v\n", flightDates, err)
	if err != nil {
		return "", fmt.Errorf("flight dates search failed: %w", err)
	}

	// Format flight dates results
	return FormatFlightDatesForDisplay(flightDates), nil
}
