package models

import (
	"time"
)

type Event struct {
	ID                string     `json:"id"`
	CreatedAt         time.Time  `json:"created_at"`
	UpdatedAt         time.Time  `json:"updated_at"`
	Title             string     `json:"title"`
	CreatorID         string     `json:"creator_id"`
	Description       string     `json:"description"`
	StartDate         time.Time  `json:"start_date"`
	EndDate           *time.Time `json:"end_date"`
	Active            bool       `json:"active"`
	Banner            string     `json:"banner"`
	Location          string     `json:"location"`
	ParticipantsCount int        `json:"participants_count"`
}
