package models

import "time"

type EventMessage struct {
	ID        string    `json:"id"`
	EventID   string    `json:"event_id"`
	UserID    string    `json:"user_id"`
	Content   string    `json:"content"`
	ParentID  *string   `json:"parent_id,omitempty"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
	User      User      `json:"user"`
	// New fields for agent interaction
	IsAgentMessage bool `json:"is_agent_message"` // True if message is from the agent
	ForAgent       bool `json:"for_agent"`        // True if message is intended for the agent (tagged with @agent)
}
