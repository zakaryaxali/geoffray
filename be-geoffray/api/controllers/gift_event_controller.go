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
		suggestion.OwnerID = event.CreatorID // Set owner to event creator

		query := `
			INSERT INTO gift_suggestions (
				id, event_id, owner_id, name_en, name_fr, description_en, description_fr,
				price_range, category, url, generated_at, created_at, updated_at
			) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
		`

		_, err := gec.DB.Exec(query,
			suggestion.ID, suggestion.EventID, suggestion.OwnerID, suggestion.NameEN, suggestion.NameFR,
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

// GetEventGiftSuggestions retrieves gift suggestions for a specific event with vote data
func (gec *GiftEventController) GetEventGiftSuggestions(c *gin.Context) {
	eventID := c.Param("id")
	if eventID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Event ID is required"})
		return
	}

	// Get user ID if authenticated (optional for viewing)
	userID, hasUser := c.Get("user_id")
	var userIDStr string
	if hasUser {
		userIDStr = userID.(string)
	}

	query := `
		SELECT 
			gs.id, gs.event_id, gs.owner_id, gs.name_en, gs.name_fr, gs.description_en, gs.description_fr,
			gs.price_range, gs.category, gs.url, gs.generated_at, gs.created_at, gs.updated_at,
			COALESCE(upvotes.count, 0) as upvote_count,
			COALESCE(downvotes.count, 0) as downvote_count,
			user_vote.vote_type as user_vote
		FROM gift_suggestions gs
		LEFT JOIN (
			SELECT suggestion_id, COUNT(*) as count
			FROM gift_suggestion_votes
			WHERE vote_type = 'upvote'
			GROUP BY suggestion_id
		) upvotes ON gs.id = upvotes.suggestion_id
		LEFT JOIN (
			SELECT suggestion_id, COUNT(*) as count
			FROM gift_suggestion_votes
			WHERE vote_type = 'downvote'
			GROUP BY suggestion_id
		) downvotes ON gs.id = downvotes.suggestion_id
		LEFT JOIN gift_suggestion_votes user_vote ON gs.id = user_vote.suggestion_id 
			AND user_vote.user_id = $2
		WHERE gs.event_id = $1
		ORDER BY (COALESCE(upvotes.count, 0) - COALESCE(downvotes.count, 0)) DESC, gs.created_at DESC
	`

	rows, err := gec.DB.Query(query, eventID, userIDStr)
	if err != nil {
		fmt.Printf("Error querying gift suggestions with votes: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve gift suggestions"})
		return
	}
	defer rows.Close()

	var suggestions []models.GiftSuggestion
	for rows.Next() {
		var suggestion models.GiftSuggestion
		var userVote sql.NullString

		err := rows.Scan(
			&suggestion.ID, &suggestion.EventID, &suggestion.OwnerID, &suggestion.NameEN, &suggestion.NameFR,
			&suggestion.DescriptionEN, &suggestion.DescriptionFR, &suggestion.PriceRange,
			&suggestion.Category, &suggestion.URL, &suggestion.GeneratedAt,
			&suggestion.CreatedAt, &suggestion.UpdatedAt,
			&suggestion.UpvoteCount, &suggestion.DownvoteCount, &userVote,
		)
		if err != nil {
			fmt.Printf("Error scanning gift suggestion: %v\n", err)
			continue
		}

		if userVote.Valid {
			suggestion.UserVote = &userVote.String
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

// VoteOnSuggestion handles voting on a gift suggestion
func (gec *GiftEventController) VoteOnSuggestion(c *gin.Context) {
	suggestionID := c.Param("id")
	if suggestionID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Suggestion ID is required"})
		return
	}

	// Get user ID from context
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	var req struct {
		VoteType string `json:"vote_type" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body: " + err.Error()})
		return
	}

	// Validate vote type
	if req.VoteType != "upvote" && req.VoteType != "downvote" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid vote type. Must be 'upvote' or 'downvote'"})
		return
	}

	userIDStr := userID.(string)

	// Check if user already has a vote on this suggestion
	var existingVoteID string
	var existingVoteType string
	checkQuery := `SELECT id, vote_type FROM gift_suggestion_votes WHERE suggestion_id = $1 AND user_id = $2`
	err := gec.DB.QueryRow(checkQuery, suggestionID, userIDStr).Scan(&existingVoteID, &existingVoteType)

	if err != nil && err != sql.ErrNoRows {
		fmt.Printf("Error checking existing vote: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to process vote"})
		return
	}

	// If vote exists and is the same type, remove it (toggle off)
	if err == nil && existingVoteType == req.VoteType {
		deleteQuery := `DELETE FROM gift_suggestion_votes WHERE id = $1`
		_, err = gec.DB.Exec(deleteQuery, existingVoteID)
		if err != nil {
			fmt.Printf("Error deleting vote: %v\n", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to remove vote"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"message": "Vote removed"})
		return
	}

	// If vote exists but different type, update it
	if err == nil && existingVoteType != req.VoteType {
		updateQuery := `UPDATE gift_suggestion_votes SET vote_type = $1, updated_at = NOW() WHERE id = $2`
		_, err = gec.DB.Exec(updateQuery, req.VoteType, existingVoteID)
		if err != nil {
			fmt.Printf("Error updating vote: %v\n", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update vote"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"message": "Vote updated", "vote_type": req.VoteType})
		return
	}

	// No existing vote, create new one
	voteID := uuid.NewString()
	insertQuery := `
		INSERT INTO gift_suggestion_votes (id, suggestion_id, user_id, vote_type, created_at, updated_at)
		VALUES ($1, $2, $3, $4, NOW(), NOW())
	`
	_, err = gec.DB.Exec(insertQuery, voteID, suggestionID, userIDStr, req.VoteType)
	if err != nil {
		fmt.Printf("Error inserting vote: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to record vote"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Vote recorded", "vote_type": req.VoteType})
}

// RemoveVote removes a user's vote from a gift suggestion
func (gec *GiftEventController) RemoveVote(c *gin.Context) {
	suggestionID := c.Param("id")
	if suggestionID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Suggestion ID is required"})
		return
	}

	// Get user ID from context
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	userIDStr := userID.(string)

	// Delete the vote
	deleteQuery := `DELETE FROM gift_suggestion_votes WHERE suggestion_id = $1 AND user_id = $2`
	result, err := gec.DB.Exec(deleteQuery, suggestionID, userIDStr)
	if err != nil {
		fmt.Printf("Error removing vote: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to remove vote"})
		return
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "No vote found to remove"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Vote removed"})
}

// DeleteGiftSuggestion deletes a gift suggestion if the user is the owner
func (gec *GiftEventController) DeleteGiftSuggestion(c *gin.Context) {
	suggestionID := c.Param("id")
	if suggestionID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Suggestion ID is required"})
		return
	}

	// Get user ID from context
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	userIDStr := userID.(string)

	// Check if the suggestion exists and if the user is the owner
	var ownerID string
	checkQuery := `SELECT owner_id FROM gift_suggestions WHERE id = $1`
	err := gec.DB.QueryRow(checkQuery, suggestionID).Scan(&ownerID)

	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"error": "Gift suggestion not found"})
			return
		}
		fmt.Printf("Error checking gift suggestion ownership: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to verify ownership"})
		return
	}

	// Verify user is the owner
	if ownerID != userIDStr {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only the suggestion owner can delete this suggestion"})
		return
	}

	// Delete the suggestion (votes will be deleted automatically due to CASCADE)
	deleteQuery := `DELETE FROM gift_suggestions WHERE id = $1`
	result, err := gec.DB.Exec(deleteQuery, suggestionID)
	if err != nil {
		fmt.Printf("Error deleting gift suggestion: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete suggestion"})
		return
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Gift suggestion not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Gift suggestion deleted successfully"})
}
