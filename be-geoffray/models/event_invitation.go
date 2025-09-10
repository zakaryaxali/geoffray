package models

import (
	"time"
)

// EventInvitation represents a pending invitation to an event for a user who doesn't have an account yet
type EventInvitation struct {
	ID         string    `json:"id"`
	EventID    string    `json:"event_id"`
	Email      string    `json:"email"`
	Phone      string    `json:"phone"`
	InviteCode string    `json:"invite_code"`
	Status     string    `json:"status"` // "pending", "accepted", "expired"
	ExpiresAt  time.Time `json:"expires_at"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}
