package services

import (
	"database/sql"
	"fmt"
	"time"

	"be-geoffray/models"
)

// StaticGiftService handles fetching curated gift suggestions from the database
type StaticGiftService struct {
	DB *sql.DB
}

// NewStaticGiftService creates a new static gift service
func NewStaticGiftService(db *sql.DB) *StaticGiftService {
	return &StaticGiftService{
		DB: db,
	}
}

// GetStaticGiftSuggestion fetches a curated suggestion for a given persona and occasion
// Returns the suggestion as a GiftSuggestion model ready for insertion into gift_suggestions table
func (s *StaticGiftService) GetStaticGiftSuggestion(personaKey, occasionKey string) (*models.GiftSuggestion, error) {
	if s.DB == nil {
		return nil, fmt.Errorf("database connection not available")
	}

	var suggestion models.GiftSuggestion
	var nameFR, nameEN sql.NullString
	var descriptionFR, descriptionEN sql.NullString
	var priceRange, category sql.NullString
	var amazonAffiliateURL sql.NullString

	err := s.DB.QueryRow(`
		SELECT name_fr, name_en, description_fr, description_en,
		       price_range, category, amazon_affiliate_url
		FROM static_gifts
		WHERE persona_key = $1 AND occasion_key = $2
	`, personaKey, occasionKey).Scan(
		&nameFR, &nameEN,
		&descriptionFR, &descriptionEN,
		&priceRange, &category,
		&amazonAffiliateURL,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("no static gift found for persona=%s, occasion=%s", personaKey, occasionKey)
		}
		return nil, fmt.Errorf("failed to fetch static gift: %w", err)
	}

	// Populate the suggestion
	if nameFR.Valid {
		suggestion.NameFR = nameFR.String
	}
	if nameEN.Valid {
		suggestion.NameEN = nameEN.String
	}
	if descriptionFR.Valid {
		suggestion.DescriptionFR = descriptionFR.String
	}
	if descriptionEN.Valid {
		suggestion.DescriptionEN = descriptionEN.String
	}
	if priceRange.Valid {
		suggestion.PriceRange = priceRange.String
	}
	if category.Valid {
		suggestion.Category = category.String
	}
	if amazonAffiliateURL.Valid {
		suggestion.AmazonAffiliateURL = &amazonAffiliateURL.String
		suggestion.IsAffiliateLink = true
	}

	// Set metadata
	suggestion.CreationMode = "static"
	now := time.Now()
	suggestion.GeneratedAt = now
	suggestion.CreatedAt = now
	suggestion.UpdatedAt = now

	// Set Amazon region (static gifts are from Amazon.fr)
	region := "FR"
	suggestion.AmazonRegion = &region
	suggestion.AmazonLastUpdated = &now

	fmt.Printf("Found static gift: %s for persona=%s, occasion=%s\n", suggestion.NameEN, personaKey, occasionKey)

	return &suggestion, nil
}

// HasStaticGift checks if a static gift exists for the given persona and occasion
func (s *StaticGiftService) HasStaticGift(personaKey, occasionKey string) bool {
	if s.DB == nil {
		return false
	}

	var count int
	err := s.DB.QueryRow(`
		SELECT COUNT(*) FROM static_gifts
		WHERE persona_key = $1 AND occasion_key = $2
	`, personaKey, occasionKey).Scan(&count)

	if err != nil {
		fmt.Printf("Error checking static gift existence: %v\n", err)
		return false
	}

	return count > 0
}
