package controllers

import (
	"database/sql"
	"fmt"
	"net/http"
	"time"

	"be-geoffray/models"
	"be-geoffray/services"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// GiftEventController handles event creation with gift suggestions
type GiftEventController struct {
	DB                    *sql.DB
	GiftSuggestionService *services.GiftSuggestionService
}

// NewGiftEventController creates a new gift event controller
func NewGiftEventController(db *sql.DB) *GiftEventController {
	return &GiftEventController{
		DB:                    db,
		GiftSuggestionService: services.NewGiftSuggestionService(),
	}
}

// CreateEventWithGifts creates an event and generates gift suggestions
func (gec *GiftEventController) CreateEventWithGifts(c *gin.Context) {
	// Get user ID from context (set by JWT middleware)
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	var req struct {
		Title         string  `json:"title" binding:"required"`
		Description   string  `json:"description"`
		StartDate     string  `json:"start_date" binding:"required"`
		EndDate       *string `json:"end_date"`
		Location      string  `json:"location"`
		Banner        string  `json:"banner"`
		GifteePersona string  `json:"giftee_persona" binding:"required"`
		EventOccasion string  `json:"event_occasion" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body: " + err.Error()})
		return
	}

	// Parse start date
	startDate, err := time.Parse(time.RFC3339, req.StartDate)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid start date format"})
		return
	}

	// Parse end date if provided
	var endDate *time.Time
	if req.EndDate != nil && *req.EndDate != "" {
		parsed, err := time.Parse(time.RFC3339, *req.EndDate)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid end date format"})
			return
		}
		endDate = &parsed
	}

	// Create event with gift information
	eventID := uuid.NewString()
	event := models.Event{
		ID:                eventID,
		CreatedAt:         time.Now(),
		UpdatedAt:         time.Now(),
		Title:             req.Title,
		CreatorID:         userID.(string),
		Description:       req.Description,
		StartDate:         startDate,
		EndDate:           endDate,
		Active:            true,
		Banner:            req.Banner,
		Location:          req.Location,
		ParticipantsCount: 1, // Creator is automatically a participant
		GifteePersona:     req.GifteePersona,
		EventOccasion:     req.EventOccasion,
	}

	// Insert event into database
	query := `
		INSERT INTO events (
			id, created_at, updated_at, title, creator_id, description, 
			start_date, end_date, active, banner, location, participants_count,
			giftee_persona, event_occasion
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
	`

	_, err = gec.DB.Exec(query,
		event.ID, event.CreatedAt, event.UpdatedAt, event.Title, event.CreatorID,
		event.Description, event.StartDate, event.EndDate, event.Active,
		event.Banner, event.Location, event.ParticipantsCount,
		event.GifteePersona, event.EventOccasion,
	)

	if err != nil {
		fmt.Printf("Error creating event: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create event"})
		return
	}

	// Add creator as a participant
	participantQuery := `
		INSERT INTO event_participants (event_id, user_id, status)
		VALUES ($1, $2, $3)
	`
	_, err = gec.DB.Exec(participantQuery,
		eventID, userID.(string), "going",
	)

	if err != nil {
		fmt.Printf("Error adding creator as participant: %v\n", err)
		// Continue even if this fails - event creation is more important
	}

	// Generate gift suggestions asynchronously
	go gec.generateGiftSuggestionsForEvent(event)

	c.JSON(http.StatusCreated, event)
}

// generateGiftSuggestionsForEvent generates and stores gift suggestions for an event
func (gec *GiftEventController) generateGiftSuggestionsForEvent(event models.Event) {
	// Prepare request for gift suggestion service
	request := services.GiftSuggestionRequest{
		GifteePersona: event.GifteePersona,
		EventOccasion: event.EventOccasion,
		EventTitle:    event.Title,
		EventDate:     event.StartDate.Format("2006-01-02"),
		Location:      event.Location,
		Description:   event.Description,
		Language:      "fr", // Default to French, could be made dynamic
	}

	// Generate suggestions using Mistral
	suggestions, err := gec.GiftSuggestionService.GenerateGiftSuggestions(request)
	if err != nil {
		fmt.Printf("Error generating gift suggestions for event %s: %v\n", event.ID, err)
		return
	}

	// Store suggestions in database
	for _, suggestion := range suggestions {
		suggestion.ID = uuid.NewString()
		suggestion.EventID = event.ID

		query := `
			INSERT INTO gift_suggestions (
				id, event_id, name_en, name_fr, description_en, description_fr,
				price_range, category, url, generated_at, created_at, updated_at
			) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
		`

		_, err := gec.DB.Exec(query,
			suggestion.ID, suggestion.EventID, suggestion.NameEN, suggestion.NameFR,
			suggestion.DescriptionEN, suggestion.DescriptionFR, suggestion.PriceRange,
			suggestion.Category, suggestion.URL, suggestion.GeneratedAt,
			suggestion.CreatedAt, suggestion.UpdatedAt,
		)

		if err != nil {
			fmt.Printf("Error storing gift suggestion %s: %v\n", suggestion.ID, err)
		}
	}

	fmt.Printf("Generated and stored %d gift suggestions for event %s\n", len(suggestions), event.ID)
}

// GetEventGiftSuggestions retrieves gift suggestions for a specific event
func (gec *GiftEventController) GetEventGiftSuggestions(c *gin.Context) {
	eventID := c.Param("id")
	if eventID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Event ID is required"})
		return
	}

	query := `
		SELECT id, event_id, name_en, name_fr, description_en, description_fr,
			   price_range, category, url, generated_at, created_at, updated_at
		FROM gift_suggestions
		WHERE event_id = $1
		ORDER BY created_at DESC
	`

	rows, err := gec.DB.Query(query, eventID)
	if err != nil {
		fmt.Printf("Error querying gift suggestions: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve gift suggestions"})
		return
	}
	defer rows.Close()

	var suggestions []models.GiftSuggestion
	for rows.Next() {
		var suggestion models.GiftSuggestion
		err := rows.Scan(
			&suggestion.ID, &suggestion.EventID, &suggestion.NameEN, &suggestion.NameFR,
			&suggestion.DescriptionEN, &suggestion.DescriptionFR, &suggestion.PriceRange,
			&suggestion.Category, &suggestion.URL, &suggestion.GeneratedAt,
			&suggestion.CreatedAt, &suggestion.UpdatedAt,
		)
		if err != nil {
			fmt.Printf("Error scanning gift suggestion: %v\n", err)
			continue
		}
		suggestions = append(suggestions, suggestion)
	}

	c.JSON(http.StatusOK, suggestions)
}

// RegenerateEventGiftSuggestions generates new gift suggestions for an existing event
func (gec *GiftEventController) RegenerateEventGiftSuggestions(c *gin.Context) {
	eventID := c.Param("id")
	if eventID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Event ID is required"})
		return
	}

	// Get user ID from context
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Get event details and verify user is the creator
	var event models.Event
	query := `
		SELECT id, title, creator_id, description, start_date, location, 
			   giftee_persona, event_occasion
		FROM events
		WHERE id = $1
	`

	err := gec.DB.QueryRow(query, eventID).Scan(
		&event.ID, &event.Title, &event.CreatorID, &event.Description,
		&event.StartDate, &event.Location, &event.GifteePersona, &event.EventOccasion,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"error": "Event not found"})
			return
		}
		fmt.Printf("Error querying event: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve event"})
		return
	}

	// Verify user is the creator
	if event.CreatorID != userID.(string) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only the event creator can regenerate gift suggestions"})
		return
	}

	// Delete existing suggestions
	deleteQuery := `DELETE FROM gift_suggestions WHERE event_id = $1`
	_, err = gec.DB.Exec(deleteQuery, eventID)
	if err != nil {
		fmt.Printf("Error deleting existing suggestions: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to clear existing suggestions"})
		return
	}

	// Generate new suggestions asynchronously
	go gec.generateGiftSuggestionsForEvent(event)

	c.JSON(http.StatusOK, gin.H{"message": "Generating new gift suggestions"})
}
