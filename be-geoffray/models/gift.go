package models

import (
	"time"
)

// GifteePersona represents a persona type for gift recipients (renamed from GiftCategory)
type GifteePersona struct {
	ID         string    `json:"id"`
	PersonaKey string    `json:"persona_key"` // Translation key for the persona name
	Color      string    `json:"color"`       // Hex color for display
	OrderIndex int       `json:"order_index"` // Display order
	Active     bool      `json:"active"`      // Whether persona is active
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}

// OccasionType represents an event occasion type
type OccasionType struct {
	ID          string    `json:"id"`
	OccasionKey string    `json:"occasion_key"` // Translation key for the occasion name
	NameEN      string    `json:"name_en"`      // English name
	NameFR      string    `json:"name_fr"`      // French name
	Color       string    `json:"color"`        // Hex color for display
	OrderIndex  int       `json:"order_index"`  // Display order
	Active      bool      `json:"active"`       // Whether occasion is active
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// GiftSuggestion represents an AI-generated gift suggestion for an event
type GiftSuggestion struct {
	ID            string    `json:"id"`
	EventID       string    `json:"event_id"`
	OwnerID       string    `json:"owner_id"`         // User ID of who created/owns this suggestion
	NameEN        string    `json:"name_en"`          // English name
	NameFR        string    `json:"name_fr"`          // French name
	DescriptionEN string    `json:"description_en"`   // English description
	DescriptionFR string    `json:"description_fr"`   // French description
	PriceRange    string    `json:"price_range"`      // e.g., "$10-$20", "$50+", etc.
	Category      string    `json:"category"`         // Gift category
	URL           string    `json:"url,omitempty"`    // Optional URL for purchasing
	Prompt        *string   `json:"prompt,omitempty"` // Optional AI prompt used to generate this suggestion
	CreationMode  string    `json:"creation_mode"`    // "manual" or "ai" - how this suggestion was created
	GeneratedAt   time.Time `json:"generated_at"`     // When this suggestion was generated
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`

	// Amazon affiliate fields
	AmazonASIN         *string    `json:"amazon_asin,omitempty"`
	AmazonAffiliateURL *string    `json:"amazon_affiliate_url,omitempty"`
	AmazonPrice        *string    `json:"amazon_price,omitempty"`
	AmazonRegion       *string    `json:"amazon_region,omitempty"`
	AmazonLastUpdated  *time.Time `json:"amazon_last_updated,omitempty"`

	// Computed field for frontend (true if amazon_affiliate_url is set)
	IsAffiliateLink bool `json:"is_affiliate_link"`

	// Vote-related fields (populated when fetching suggestions)
	UpvoteCount   int     `json:"upvote_count"`
	DownvoteCount int     `json:"downvote_count"`
	UserVote      *string `json:"user_vote,omitempty"` // "upvote", "downvote", or null
}

// GiftSuggestionVote represents a user's vote on a gift suggestion
type GiftSuggestionVote struct {
	ID           string    `json:"id"`
	SuggestionID string    `json:"suggestion_id"`
	UserID       string    `json:"user_id"`
	VoteType     string    `json:"vote_type"` // "upvote" or "downvote"
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// GiftSelection represents a user's selection of persona and occasion (updated)
type GiftSelection struct {
	ID         string    `json:"id"`
	UserID     string    `json:"user_id"`
	CategoryID string    `json:"category_id"` // Maps to persona for backward compatibility
	OccasionID *string   `json:"occasion_id,omitempty"`
	EventID    *string   `json:"event_id,omitempty"`
	CreatedAt  time.Time `json:"created_at"`
}
