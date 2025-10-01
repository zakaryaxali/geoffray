package services

import (
	"errors"
	"log"

	"be-geoffray/db"
)

// ParticipantService contains methods for handling participant-related operations
type ParticipantService struct{}

// NewParticipantService creates a new instance of ParticipantService
func NewParticipantService() *ParticipantService {
	return &ParticipantService{}
}

// UpdateParticipantStatus updates a participant's status for an event
func (s *ParticipantService) UpdateParticipantStatus(eventID string, userID interface{}, status string) error {
	// Validate status
	if status != "accepted" && status != "pending" && status != "declined" {
		return errors.New("invalid status: must be 'accepted', 'pending', or 'declined'")
	}

	// Check if the user is a participant in this event
	var participantExists bool
	participantQuery := `SELECT EXISTS(SELECT 1 FROM event_participants WHERE event_id = $1 AND user_id = $2)`
	err := db.DB.QueryRow(participantQuery, eventID, userID).Scan(&participantExists)
	if err != nil {
		log.Println("Error checking participant:", err)
		return errors.New("failed to check participant status")
	}

	if !participantExists {
		return errors.New("user is not a participant in this event")
	}

	// Update the participant status
	updateQuery := `UPDATE event_participants SET status = $1 WHERE event_id = $2 AND user_id = $3`
	_, err = db.DB.Exec(updateQuery, status, eventID, userID)
	if err != nil {
		log.Println("Error updating participant status:", err)
		return errors.New("failed to update participant status")
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

	return nil
}

// IsParticipant checks if a user is a participant in an event
func (s *ParticipantService) IsParticipant(eventID string, userID interface{}) (bool, error) {
	var participantExists bool
	participantQuery := `SELECT EXISTS(SELECT 1 FROM event_participants WHERE event_id = $1 AND user_id = $2)`
	err := db.DB.QueryRow(participantQuery, eventID, userID).Scan(&participantExists)
	if err != nil {
		log.Println("Error checking participant:", err)
		return false, errors.New("failed to check participant status")
	}
	return participantExists, nil
}

// GetParticipantStatus gets a participant's current status for an event
func (s *ParticipantService) GetParticipantStatus(eventID string, userID interface{}) (string, error) {
	var status string
	statusQuery := `SELECT status FROM event_participants WHERE event_id = $1 AND user_id = $2`
	err := db.DB.QueryRow(statusQuery, eventID, userID).Scan(&status)
	if err != nil {
		log.Println("Error getting participant status:", err)
		return "", errors.New("failed to get participant status")
	}
	return status, nil
}
