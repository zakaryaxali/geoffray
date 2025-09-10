package models

type EventParticipant struct {
	EventID string `json:"event_id"`
	UserID  string `json:"user_id"`
}
