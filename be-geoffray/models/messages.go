package models

import "time"

type SenderType string

const (
	SenderUser SenderType = "user"
	SenderAI   SenderType = "ai"
)

type Message struct {
	ID        string     `json:"id"`
	EventID   string     `json:"event_id"`
	UserID    string     `json:"user_id"`
	Sender    SenderType `json:"sender"`
	Message   string     `json:"message"`
	CreatedAt time.Time  `json:"created_at"`
}
