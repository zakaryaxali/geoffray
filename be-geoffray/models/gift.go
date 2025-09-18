package models

import (
	"time"
)

// GiftCategory represents a category of gifts
type GiftCategory struct {
	ID         string    `json:"id"`
	NameKey    string    `json:"name_key"`    // Translation key for the category name
	Color      string    `json:"color"`       // Hex color for display
	OrderIndex int       `json:"order_index"` // Display order
	Active     bool      `json:"active"`      // Whether category is active
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}

// GiftSuggestion represents a gift suggestion
type GiftSuggestion struct {
	ID          string    `json:"id"`
	CategoryID  string    `json:"category_id"`
	EventID     *string   `json:"event_id,omitempty"` // Optional event association
	Name        string    `json:"name"`
	Description string    `json:"description"`
	PriceRange  string    `json:"price_range"` // e.g., "$10-$20", "$50+", etc.
	URL         string    `json:"url,omitempty"`
	ImageURL    string    `json:"image_url,omitempty"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// GiftSelection represents a user's selection of a gift category
type GiftSelection struct {
	ID         string    `json:"id"`
	UserID     string    `json:"user_id"`
	CategoryID string    `json:"category_id"`
	EventID    *string   `json:"event_id,omitempty"`
	CreatedAt  time.Time `json:"created_at"`
}
