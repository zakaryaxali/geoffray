package services

import (
	"crypto/rand"
	"database/sql"
	"encoding/hex"
	"errors"
	"log"
	"strconv"
	"time"

	"be-geoffray/db"
	"be-geoffray/models"
)

// EventService contains methods for handling event-related operations
type EventService struct{}

// NewEventService creates a new instance of EventService
func NewEventService() *EventService {
	return &EventService{}
}

// CreateEvent creates a new event and adds the creator as a participant
func (s *EventService) CreateEvent(creatorID string, title string, description string, startDate time.Time, endDate *time.Time, banner string, location string) (*models.Event, error) {
	// Create event
	event := models.Event{
		CreatorID:         creatorID,
		Title:             title,
		Description:       description,
		StartDate:         startDate,
		EndDate:           endDate,
		Banner:            banner,
		Location:          location,
		Active:            true,
		ParticipantsCount: 1, // Initialize to 1 for the creator
	}

	// Start a transaction
	tx, err := db.DB.Begin()
	if err != nil {
		log.Println("Error starting transaction:", err)
		return nil, errors.New("failed to start transaction")
	}
	defer func() {
		if err != nil {
			tx.Rollback()
		}
	}()

	// Save to database
	query := `INSERT INTO events (creator_id, title, description, start_date, end_date, banner, location, active, participants_count, created_at, updated_at) 
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id`

	now := time.Now()
	var eventID string
	err = tx.QueryRow(
		query,
		event.CreatorID,
		event.Title,
		event.Description,
		event.StartDate,
		event.EndDate,
		event.Banner,
		event.Location,
		event.Active,
		1, // Initialize participants_count to 1 (for the creator)
		now,
		now,
	).Scan(&eventID)

	if err != nil {
		log.Println("Error creating event:", err)
		return nil, errors.New("failed to create event")
	}

	// Insert the creator as a participant in event_participants with 'accepted' status
	participantQuery := `INSERT INTO event_participants (event_id, user_id, status) VALUES ($1, $2, $3)`
	_, err = tx.Exec(participantQuery, eventID, event.CreatorID, "accepted")

	if err != nil {
		log.Println("Error adding creator as participant:", err)
		return nil, errors.New("failed to add creator as participant")
	}

	// Commit the transaction
	err = tx.Commit()
	if err != nil {
		log.Println("Error committing transaction:", err)
		return nil, errors.New("failed to commit transaction")
	}

	event.ID = eventID
	return &event, nil
}

// Participant represents a user participating in an event
type Participant struct {
	ID        string `json:"id"`
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
	Status    string `json:"status"`
}

// GetEventByID retrieves an event by its ID along with its participants
func (s *EventService) GetEventByID(eventID string, userID string) (*models.Event, []Participant, error) {
	// Query to get the event by ID including persona and occasion fields
	query := `
		SELECT e.id, e.creator_id, e.title, e.description, e.start_date, e.end_date, e.banner, e.location, e.active, e.created_at, e.updated_at, e.giftee_persona, e.event_occasion
		FROM events e
		WHERE e.id = $1
	`

	var event models.Event
	err := db.DB.QueryRow(query, eventID).Scan(
		&event.ID, &event.CreatorID, &event.Title, &event.Description,
		&event.StartDate, &event.EndDate, &event.Banner, &event.Location, &event.Active,
		&event.CreatedAt, &event.UpdatedAt, &event.GifteePersona, &event.EventOccasion,
	)

	if err != nil {
		log.Println("Error fetching event:", err)
		return nil, nil, errors.New("event not found")
	}

	// Query to get the count of participants (accepted, pending, and going) for this event
	participantsCountQuery := `
		SELECT COUNT(*) FROM event_participants 
		WHERE event_id = $1 AND (status = 'accepted' OR status = 'pending' OR status = 'going')
	`
	err = db.DB.QueryRow(participantsCountQuery, event.ID).Scan(&event.ParticipantsCount)
	if err != nil {
		log.Printf("Error counting participants for event %s: %v", event.ID, err)
		// If there's an error, just set count to 0 and continue
		event.ParticipantsCount = 0
	}

	// Check if the user is the creator or a participant
	hasAccess := false

	// If user is the creator, they have access
	if event.CreatorID == userID {
		hasAccess = true
	} else {
		// Check if user is a participant
		participantQuery := `SELECT 1 FROM event_participants WHERE event_id = $1 AND user_id = $2 LIMIT 1`
		var exists int
		err = db.DB.QueryRow(participantQuery, eventID, userID).Scan(&exists)
		if err == nil {
			hasAccess = true
		}
	}

	// If user doesn't have access, return error
	if !hasAccess {
		return nil, nil, errors.New("event not found")
	}

	// Fetch participants for this event
	participantsQuery := `
		SELECT u.id, u.first_name, u.last_name, ep.status
		FROM event_participants ep
		JOIN users u ON ep.user_id = u.id
		WHERE ep.event_id = $1
	`

	rows, err := db.DB.Query(participantsQuery, eventID)
	if err != nil {
		log.Println("Error fetching participants:", err)
		return &event, []Participant{}, nil
	}
	defer rows.Close()

	var participants []Participant
	for rows.Next() {
		var p Participant
		if err := rows.Scan(&p.ID, &p.FirstName, &p.LastName, &p.Status); err != nil {
			log.Println("Error scanning participant:", err)
			continue
		}
		participants = append(participants, p)
	}

	return &event, participants, nil
}

// GetUserEvents returns all events where the user is either the creator or a participant
func (s *EventService) GetUserEvents(userID string) ([]models.Event, error) {
	// Query to get all events where the user is either the creator or a participant
	query := `
		SELECT DISTINCT e.id, e.creator_id, e.title, e.description, e.start_date, e.end_date, e.banner, e.location, e.active, e.created_at, e.updated_at, e.participants_count, e.giftee_persona, e.event_occasion
		FROM events e
		LEFT JOIN event_participants ep ON e.id = ep.event_id
		WHERE e.creator_id = $1 OR ep.user_id = $1
		ORDER BY e.created_at DESC
	`

	rows, err := db.DB.Query(query, userID)
	if err != nil {
		log.Println("Error fetching user events:", err)
		return nil, errors.New("failed to fetch events")
	}
	defer rows.Close()

	// Initialize events as an empty array to ensure we return [] instead of null when there are no events
	events := []models.Event{}
	for rows.Next() {
		var event models.Event
		err := rows.Scan(
			&event.ID, &event.CreatorID, &event.Title, &event.Description,
			&event.StartDate, &event.EndDate, &event.Banner, &event.Location, &event.Active,
			&event.CreatedAt, &event.UpdatedAt, &event.ParticipantsCount,
			&event.GifteePersona, &event.EventOccasion,
		)
		if err != nil {
			log.Println("Error scanning event:", err)
			return nil, errors.New("error scanning event")
		}

		// Query to get the count of participants (accepted, pending, and going) for this event
		participantsQuery := `
			SELECT COUNT(*) FROM event_participants 
			WHERE event_id = $1 AND (status = 'accepted' OR status = 'pending' OR status = 'going')
		`
		err = db.DB.QueryRow(participantsQuery, event.ID).Scan(&event.ParticipantsCount)
		if err != nil {
			log.Printf("Error counting participants for event %s: %v", event.ID, err)
			// If there's an error, just set count to 0 and continue
			event.ParticipantsCount = 0
		}

		events = append(events, event)
	}

	return events, nil
}

// UpdateEvent updates an existing event's details
func (s *EventService) UpdateEvent(eventID string, userID string, updates map[string]interface{}) (*models.Event, error) {
	// Verify that the event exists and the user is the creator
	var creatorID string
	eventQuery := `SELECT creator_id FROM events WHERE id = $1`
	err := db.DB.QueryRow(eventQuery, eventID).Scan(&creatorID)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, errors.New("event not found")
		}
		log.Println("Error verifying event:", err)
		return nil, errors.New("failed to verify event")
	}

	// Only the creator can update the event
	if creatorID != userID {
		return nil, errors.New("only the event creator can update this event")
	}

	// Validate dates if both are provided
	if startDate, startOk := updates["start_date"].(time.Time); startOk {
		if endDate, endOk := updates["end_date"].(*time.Time); endOk && endDate != nil {
			if endDate.Before(startDate) {
				return nil, errors.New("end date cannot be before start date")
			}
		}
	}

	// If only end date is provided, validate against existing start date
	if _, startOk := updates["start_date"].(time.Time); !startOk {
		if endDate, endOk := updates["end_date"].(*time.Time); endOk && endDate != nil {
			var startDate time.Time
			err := db.DB.QueryRow("SELECT start_date FROM events WHERE id = $1", eventID).Scan(&startDate)
			if err == nil && endDate.Before(startDate) {
				return nil, errors.New("end date cannot be before existing start date")
			}
		}
	}

	// Build the update query dynamically based on which fields are provided
	updateQuery := `UPDATE events SET updated_at = $1`
	updateParams := []interface{}{time.Now()}
	paramCount := 1

	// Add fields to update only if they are provided
	if title, ok := updates["title"].(string); ok {
		paramCount++
		updateQuery += `, title = $` + strconv.Itoa(paramCount)
		updateParams = append(updateParams, title)
	}

	if description, ok := updates["description"].(string); ok {
		paramCount++
		updateQuery += `, description = $` + strconv.Itoa(paramCount)
		updateParams = append(updateParams, description)
	}

	if startDate, ok := updates["start_date"].(time.Time); ok {
		paramCount++
		updateQuery += `, start_date = $` + strconv.Itoa(paramCount)
		updateParams = append(updateParams, startDate)
	}

	// Special case for remove_end_date flag
	if removeEndDate, ok := updates["remove_end_date"].(bool); ok && removeEndDate {
		log.Println("Removing end_date by setting it to NULL")
		updateQuery += `, end_date = NULL`
		// No need to add a parameter for NULL
	} else if endDateValue, ok := updates["end_date"]; ok {
		// Normal case for updating end_date
		paramCount++
		updateQuery += `, end_date = $` + strconv.Itoa(paramCount)

		// Check if it's nil (explicitly set to NULL)
		if endDateValue == nil {
			log.Println("Setting end_date to NULL in database")
			updateParams = append(updateParams, nil)
		} else if endDate, ok := endDateValue.(*time.Time); ok {
			log.Println("Setting end_date to time value in database")
			updateParams = append(updateParams, endDate)
		}
	}

	if location, ok := updates["location"].(string); ok {
		paramCount++
		updateQuery += `, location = $` + strconv.Itoa(paramCount)
		updateParams = append(updateParams, location)
	}

	// Add the WHERE clause and event ID parameter
	paramCount++
	updateQuery += ` WHERE id = $` + strconv.Itoa(paramCount)
	updateParams = append(updateParams, eventID)

	// Execute the update query
	_, err = db.DB.Exec(updateQuery, updateParams...)
	if err != nil {
		log.Printf("Error updating event %s: %v", eventID, err)
		return nil, errors.New("failed to update event")
	}

	// Fetch the updated event to return
	query := `
		SELECT id, creator_id, title, description, start_date, end_date, banner, location, active, created_at, updated_at, participants_count
		FROM events
		WHERE id = $1
	`

	var event models.Event
	err = db.DB.QueryRow(query, eventID).Scan(
		&event.ID, &event.CreatorID, &event.Title, &event.Description,
		&event.StartDate, &event.EndDate, &event.Banner, &event.Location, &event.Active,
		&event.CreatedAt, &event.UpdatedAt, &event.ParticipantsCount,
	)

	if err != nil {
		log.Printf("Error fetching updated event %s: %v", eventID, err)
		return nil, errors.New("failed to fetch updated event")
	}

	return &event, nil
}

// InviteParticipant handles inviting a participant to an event
func (s *EventService) InviteParticipant(eventID string, creatorID string, identifier string, identifierType string) (bool, string, error) {
	// Verify that the event exists and the user has permission to invite
	var eventCreatorID string
	eventQuery := `SELECT creator_id FROM events WHERE id = $1`
	err := db.DB.QueryRow(eventQuery, eventID).Scan(&eventCreatorID)
	if err != nil {
		if err == sql.ErrNoRows {
			return false, "", errors.New("event not found")
		}
		log.Println("Error verifying event:", err)
		return false, "", errors.New("failed to verify event")
	}

	// Only the creator can invite participants for now
	if eventCreatorID != creatorID {
		return false, "", errors.New("only the event creator can invite participants")
	}

	// Check if a user with this identifier exists
	var existingUserID string
	userQuery := ""
	if identifierType == "email" {
		userQuery = `SELECT id FROM users WHERE email = $1`
	} else {
		userQuery = `SELECT id FROM users WHERE phone_number = $1`
	}

	err = db.DB.QueryRow(userQuery, identifier).Scan(&existingUserID)

	// If the user exists
	if err == nil {
		// Check if they're already a participant
		var participantExists int
		participantQuery := `SELECT 1 FROM event_participants WHERE event_id = $1 AND user_id = $2 LIMIT 1`
		err = db.DB.QueryRow(participantQuery, eventID, existingUserID).Scan(&participantExists)

		if err == nil {
			// User is already a participant
			return true, "", nil
		}

		// Add the user as a participant with 'pending' status
		_, err = db.DB.Exec(`INSERT INTO event_participants (event_id, user_id, status) VALUES ($1, $2, $3)`, eventID, existingUserID, "pending")
		if err != nil {
			log.Println("Error adding participant:", err)
			return false, "", errors.New("failed to add participant")
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

		return true, "", nil
	}

	// User doesn't exist, create an invitation
	inviteCode := s.generateInviteCode()
	// Set expiration to 7 days from now
	expiresAt := time.Now().AddDate(0, 0, 7)

	// Create the invitation record
	inviteQuery := `
		INSERT INTO event_invitations 
		(event_id, email, phone, invite_code, status, expires_at, created_at, updated_at) 
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
		RETURNING id
	`

	var invitationID string
	var email, phone sql.NullString

	if identifierType == "email" {
		email = sql.NullString{String: identifier, Valid: true}
		phone = sql.NullString{Valid: false}
	} else {
		email = sql.NullString{Valid: false}
		phone = sql.NullString{String: identifier, Valid: true}
	}

	now := time.Now()
	err = db.DB.QueryRow(
		inviteQuery,
		eventID,
		email,
		phone,
		inviteCode,
		"pending",
		expiresAt,
		now,
		now,
	).Scan(&invitationID)

	if err != nil {
		log.Println("Error creating invitation:", err)
		return false, "", errors.New("failed to create invitation")
	}

	return false, inviteCode, nil
}

// generateInviteCode creates a random code for invitation links
func (s *EventService) generateInviteCode() string {
	bytes := make([]byte, 4) // 8 hex characters
	_, err := rand.Read(bytes)
	if err != nil {
		// Fallback to a timestamp-based code if random generation fails
		return time.Now().Format("20060102150405")
	}
	return hex.EncodeToString(bytes)
}

// SyncParticipantCounts updates the participants_count field for all events
// This is useful for fixing existing data or running as a maintenance task
func (s *EventService) SyncParticipantCounts() error {
	// First, ensure all event creators are participants
	// This handles historical events where creators weren't added as participants
	ensureCreatorsQuery := `
		INSERT INTO event_participants (event_id, user_id, status)
		SELECT e.id, e.creator_id, 'going'
		FROM events e
		WHERE NOT EXISTS (
			SELECT 1 FROM event_participants ep 
			WHERE ep.event_id = e.id AND ep.user_id = e.creator_id
		)
	`

	_, err := db.DB.Exec(ensureCreatorsQuery)
	if err != nil {
		log.Printf("Error ensuring creators are participants: %v", err)
		return errors.New("failed to ensure creators are participants")
	}

	// Update all events to have the correct participants_count
	updateQuery := `
		UPDATE events 
		SET participants_count = (
			SELECT COUNT(*) 
			FROM event_participants 
			WHERE event_participants.event_id = events.id 
			AND (event_participants.status = 'accepted' OR event_participants.status = 'pending' OR event_participants.status = 'going')
		)
	`

	_, err = db.DB.Exec(updateQuery)
	if err != nil {
		log.Printf("Error syncing participant counts: %v", err)
		return errors.New("failed to sync participant counts")
	}

	log.Println("Successfully synced participant counts for all events")
	return nil
}
