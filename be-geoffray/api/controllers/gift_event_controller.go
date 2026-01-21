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
	StaticGiftService     *services.StaticGiftService
	URLValidator          *services.URLValidator
}

// NewGiftEventController creates a new gift event controller
func NewGiftEventController(db *sql.DB) *GiftEventController {
	return &GiftEventController{
		DB:                    db,
		GiftSuggestionService: services.NewGiftSuggestionService(),
		StaticGiftService:     services.NewStaticGiftService(db),
		URLValidator:          services.NewURLValidator(),
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

	// Insert static gift synchronously (fast ~20ms) so user sees content immediately
	var staticSuggestion *models.GiftSuggestion
	staticSuggestion, err = gec.StaticGiftService.GetStaticGiftSuggestion(event.GifteePersona, event.EventOccasion)
	if err == nil && staticSuggestion != nil {
		staticSuggestion.ID = uuid.NewString()
		staticSuggestion.EventID = event.ID
		staticSuggestion.OwnerID = event.CreatorID

		// Insert static gift into database
		staticQuery := `
			INSERT INTO gift_suggestions (
				id, event_id, owner_id, name_en, name_fr, description_en, description_fr,
				price_range, category, url, creation_mode, generated_at, created_at, updated_at,
				amazon_asin, amazon_affiliate_url, amazon_price, amazon_region, amazon_last_updated
			) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
		`
		_, insertErr := gec.DB.Exec(staticQuery,
			staticSuggestion.ID, staticSuggestion.EventID, staticSuggestion.OwnerID,
			staticSuggestion.NameEN, staticSuggestion.NameFR,
			staticSuggestion.DescriptionEN, staticSuggestion.DescriptionFR,
			staticSuggestion.PriceRange, staticSuggestion.Category, staticSuggestion.URL,
			staticSuggestion.CreationMode, staticSuggestion.GeneratedAt,
			staticSuggestion.CreatedAt, staticSuggestion.UpdatedAt,
			staticSuggestion.AmazonASIN, staticSuggestion.AmazonAffiliateURL,
			staticSuggestion.AmazonPrice, staticSuggestion.AmazonRegion, staticSuggestion.AmazonLastUpdated,
		)
		if insertErr != nil {
			fmt.Printf("Error inserting static gift suggestion: %v\n", insertErr)
			staticSuggestion = nil // Clear so AI knows to generate 3 instead of 2
		} else {
			fmt.Printf("Inserted static gift suggestion '%s' for event %s\n", staticSuggestion.NameEN, event.ID)
		}
	} else {
		fmt.Printf("No static gift found for event %s (persona=%s, occasion=%s): %v\n",
			event.ID, event.GifteePersona, event.EventOccasion, err)
	}

	// Generate AI gift suggestions asynchronously (slow ~12s)
	go gec.generateAIGiftSuggestionsForEvent(event, staticSuggestion)

	c.JSON(http.StatusCreated, event)
}

// generateGiftSuggestionsForEvent generates and stores gift suggestions for an event
// Uses static-first approach: 1 curated static suggestion + 2 AI-generated suggestions
func (gec *GiftEventController) generateGiftSuggestionsForEvent(event models.Event) {
	// Fetch existing suggestions for this event to avoid duplicates
	existingSuggestions, err := gec.fetchExistingSuggestions(event.ID)
	if err != nil {
		fmt.Printf("Error fetching existing suggestions for event %s: %v\n", event.ID, err)
		// Continue with empty list if fetch fails
		existingSuggestions = []models.GiftSuggestion{}
	}

	var allSuggestions []models.GiftSuggestion

	// Step 1: Try to get a static (curated) suggestion first
	staticSuggestion, err := gec.StaticGiftService.GetStaticGiftSuggestion(event.GifteePersona, event.EventOccasion)
	if err != nil {
		fmt.Printf("No static gift found for event %s (persona=%s, occasion=%s): %v\n",
			event.ID, event.GifteePersona, event.EventOccasion, err)
		// Continue without static suggestion - will generate 3 AI suggestions instead
	} else {
		// Set IDs and event reference for the static suggestion
		staticSuggestion.ID = uuid.NewString()
		staticSuggestion.EventID = event.ID
		staticSuggestion.OwnerID = event.CreatorID
		allSuggestions = append(allSuggestions, *staticSuggestion)
		fmt.Printf("Added static gift suggestion '%s' for event %s\n", staticSuggestion.NameEN, event.ID)
	}

	// Step 2: Generate AI suggestions (2 if we have static, 3 otherwise)
	// Combine existing suggestions with static suggestion to avoid duplicates
	suggestionsToAvoid := append(existingSuggestions, allSuggestions...)

	// Prepare request for gift suggestion service
	request := services.GiftSuggestionRequest{
		GifteePersona:    event.GifteePersona,
		EventOccasion:    event.EventOccasion,
		EventTitle:       event.Title,
		EventDate:        event.StartDate.Format("2006-01-02"),
		Location:         event.Location,
		Description:      event.Description,
		Language:         "fr", // Default to French, could be made dynamic
		SingleSuggestion: false,
	}

	// Generate AI suggestions using Mistral with similarity checking
	aiSuggestions, err := gec.GiftSuggestionService.GenerateGiftSuggestions(request, suggestionsToAvoid)
	if err != nil {
		fmt.Printf("Error generating AI gift suggestions for event %s: %v\n", event.ID, err)
		// Continue with just static suggestion if available
	} else {
		// Set IDs and event reference for AI suggestions
		for i := range aiSuggestions {
			aiSuggestions[i].ID = uuid.NewString()
			aiSuggestions[i].EventID = event.ID
			aiSuggestions[i].OwnerID = event.CreatorID
			aiSuggestions[i].CreationMode = "ai"
		}
		allSuggestions = append(allSuggestions, aiSuggestions...)
		fmt.Printf("Generated %d AI suggestions for event %s\n", len(aiSuggestions), event.ID)
	}

	// Step 3: Store all suggestions in database
	for _, suggestion := range allSuggestions {
		query := `
			INSERT INTO gift_suggestions (
				id, event_id, owner_id, name_en, name_fr, description_en, description_fr,
				price_range, category, url, creation_mode, generated_at, created_at, updated_at,
				amazon_asin, amazon_affiliate_url, amazon_price, amazon_region, amazon_last_updated
			) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
		`

		_, err := gec.DB.Exec(query,
			suggestion.ID, suggestion.EventID, suggestion.OwnerID, suggestion.NameEN, suggestion.NameFR,
			suggestion.DescriptionEN, suggestion.DescriptionFR, suggestion.PriceRange,
			suggestion.Category, suggestion.URL, suggestion.CreationMode, suggestion.GeneratedAt,
			suggestion.CreatedAt, suggestion.UpdatedAt,
			suggestion.AmazonASIN, suggestion.AmazonAffiliateURL, suggestion.AmazonPrice,
			suggestion.AmazonRegion, suggestion.AmazonLastUpdated,
		)

		if err != nil {
			fmt.Printf("Error storing gift suggestion %s: %v\n", suggestion.ID, err)
		}
	}

	staticCount := 0
	aiCount := 0
	for _, s := range allSuggestions {
		if s.CreationMode == "static" {
			staticCount++
		} else {
			aiCount++
		}
	}
	fmt.Printf("Generated and stored %d gift suggestions for event %s (%d static, %d AI)\n",
		len(allSuggestions), event.ID, staticCount, aiCount)
}

// generateAIGiftSuggestionsForEvent generates only AI gift suggestions (static gift already inserted synchronously)
// This function is called asynchronously after the event is created
func (gec *GiftEventController) generateAIGiftSuggestionsForEvent(event models.Event, staticSuggestion *models.GiftSuggestion) {
	// Build list of suggestions to avoid duplicates
	var suggestionsToAvoid []models.GiftSuggestion

	// Include the static suggestion if it was inserted
	if staticSuggestion != nil {
		suggestionsToAvoid = append(suggestionsToAvoid, *staticSuggestion)
	}

	// Also fetch any existing suggestions from the database (in case of race conditions)
	existingSuggestions, err := gec.fetchExistingSuggestions(event.ID)
	if err != nil {
		fmt.Printf("Error fetching existing suggestions for event %s: %v\n", event.ID, err)
	} else {
		suggestionsToAvoid = append(suggestionsToAvoid, existingSuggestions...)
	}

	// Prepare request for gift suggestion service
	request := services.GiftSuggestionRequest{
		GifteePersona:    event.GifteePersona,
		EventOccasion:    event.EventOccasion,
		EventTitle:       event.Title,
		EventDate:        event.StartDate.Format("2006-01-02"),
		Location:         event.Location,
		Description:      event.Description,
		Language:         "fr", // Default to French, could be made dynamic
		SingleSuggestion: false,
	}

	// Generate AI suggestions using Mistral with similarity checking
	aiSuggestions, err := gec.GiftSuggestionService.GenerateGiftSuggestions(request, suggestionsToAvoid)
	if err != nil {
		fmt.Printf("Error generating AI gift suggestions for event %s: %v\n", event.ID, err)
		return
	}

	// Set IDs and event reference for AI suggestions, then store them
	for i := range aiSuggestions {
		aiSuggestions[i].ID = uuid.NewString()
		aiSuggestions[i].EventID = event.ID
		aiSuggestions[i].OwnerID = event.CreatorID
		aiSuggestions[i].CreationMode = "ai"

		query := `
			INSERT INTO gift_suggestions (
				id, event_id, owner_id, name_en, name_fr, description_en, description_fr,
				price_range, category, url, creation_mode, generated_at, created_at, updated_at,
				amazon_asin, amazon_affiliate_url, amazon_price, amazon_region, amazon_last_updated
			) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
		`

		_, err := gec.DB.Exec(query,
			aiSuggestions[i].ID, aiSuggestions[i].EventID, aiSuggestions[i].OwnerID,
			aiSuggestions[i].NameEN, aiSuggestions[i].NameFR,
			aiSuggestions[i].DescriptionEN, aiSuggestions[i].DescriptionFR,
			aiSuggestions[i].PriceRange, aiSuggestions[i].Category, aiSuggestions[i].URL,
			aiSuggestions[i].CreationMode, aiSuggestions[i].GeneratedAt,
			aiSuggestions[i].CreatedAt, aiSuggestions[i].UpdatedAt,
			aiSuggestions[i].AmazonASIN, aiSuggestions[i].AmazonAffiliateURL,
			aiSuggestions[i].AmazonPrice, aiSuggestions[i].AmazonRegion, aiSuggestions[i].AmazonLastUpdated,
		)

		if err != nil {
			fmt.Printf("Error storing AI gift suggestion %s: %v\n", aiSuggestions[i].ID, err)
		}
	}

	fmt.Printf("Generated and stored %d AI gift suggestions for event %s\n", len(aiSuggestions), event.ID)
}

// fetchExistingSuggestions retrieves existing gift suggestions for an event (without vote data)
func (gec *GiftEventController) fetchExistingSuggestions(eventID string) ([]models.GiftSuggestion, error) {
	query := `
		SELECT id, event_id, owner_id, name_en, name_fr, description_en, description_fr,
			price_range, category, url, prompt, creation_mode, generated_at, created_at, updated_at
		FROM gift_suggestions
		WHERE event_id = $1
		ORDER BY created_at DESC
	`

	rows, err := gec.DB.Query(query, eventID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var suggestions []models.GiftSuggestion
	for rows.Next() {
		var suggestion models.GiftSuggestion
		var prompt sql.NullString

		err := rows.Scan(
			&suggestion.ID, &suggestion.EventID, &suggestion.OwnerID,
			&suggestion.NameEN, &suggestion.NameFR,
			&suggestion.DescriptionEN, &suggestion.DescriptionFR,
			&suggestion.PriceRange, &suggestion.Category, &suggestion.URL,
			&prompt, &suggestion.CreationMode,
			&suggestion.GeneratedAt, &suggestion.CreatedAt, &suggestion.UpdatedAt,
		)

		if err != nil {
			return nil, err
		}

		if prompt.Valid {
			suggestion.Prompt = &prompt.String
		}

		suggestions = append(suggestions, suggestion)
	}

	return suggestions, nil
}

// fetchExistingSuggestionsExcluding retrieves existing gift suggestions for an event, excluding a specific suggestion
func (gec *GiftEventController) fetchExistingSuggestionsExcluding(eventID, excludeSuggestionID string) ([]models.GiftSuggestion, error) {
	query := `
		SELECT id, event_id, owner_id, name_en, name_fr, description_en, description_fr,
			price_range, category, url, prompt, creation_mode, generated_at, created_at, updated_at
		FROM gift_suggestions
		WHERE event_id = $1 AND id != $2
		ORDER BY created_at DESC
	`

	rows, err := gec.DB.Query(query, eventID, excludeSuggestionID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var suggestions []models.GiftSuggestion
	for rows.Next() {
		var suggestion models.GiftSuggestion
		var prompt sql.NullString

		err := rows.Scan(
			&suggestion.ID, &suggestion.EventID, &suggestion.OwnerID,
			&suggestion.NameEN, &suggestion.NameFR,
			&suggestion.DescriptionEN, &suggestion.DescriptionFR,
			&suggestion.PriceRange, &suggestion.Category, &suggestion.URL,
			&prompt, &suggestion.CreationMode,
			&suggestion.GeneratedAt, &suggestion.CreatedAt, &suggestion.UpdatedAt,
		)

		if err != nil {
			return nil, err
		}

		if prompt.Valid {
			suggestion.Prompt = &prompt.String
		}

		suggestions = append(suggestions, suggestion)
	}

	return suggestions, nil
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
			gs.price_range, gs.category, gs.url, gs.prompt, gs.creation_mode, gs.generated_at, gs.created_at, gs.updated_at,
			gs.amazon_asin, gs.amazon_affiliate_url, gs.amazon_price, gs.amazon_region, gs.amazon_last_updated,
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
		var url sql.NullString
		var prompt sql.NullString
		var amazonASIN, amazonAffiliateURL, amazonPrice, amazonRegion sql.NullString
		var amazonLastUpdated sql.NullTime

		err := rows.Scan(
			&suggestion.ID, &suggestion.EventID, &suggestion.OwnerID, &suggestion.NameEN, &suggestion.NameFR,
			&suggestion.DescriptionEN, &suggestion.DescriptionFR, &suggestion.PriceRange,
			&suggestion.Category, &url, &prompt, &suggestion.CreationMode, &suggestion.GeneratedAt,
			&suggestion.CreatedAt, &suggestion.UpdatedAt,
			&amazonASIN, &amazonAffiliateURL, &amazonPrice, &amazonRegion, &amazonLastUpdated,
			&suggestion.UpvoteCount, &suggestion.DownvoteCount, &userVote,
		)
		if err != nil {
			fmt.Printf("Error scanning gift suggestion: %v\n", err)
			continue
		}

		// Handle nullable URL field
		if url.Valid {
			suggestion.URL = url.String
		} else {
			suggestion.URL = ""
		}

		// Handle nullable prompt field
		if prompt.Valid {
			suggestion.Prompt = &prompt.String
		}

		// Handle nullable Amazon fields
		if amazonASIN.Valid {
			suggestion.AmazonASIN = &amazonASIN.String
		}
		if amazonAffiliateURL.Valid {
			suggestion.AmazonAffiliateURL = &amazonAffiliateURL.String
			suggestion.IsAffiliateLink = true
		}
		if amazonPrice.Valid {
			suggestion.AmazonPrice = &amazonPrice.String
		}
		if amazonRegion.Valid {
			suggestion.AmazonRegion = &amazonRegion.String
		}
		if amazonLastUpdated.Valid {
			suggestion.AmazonLastUpdated = &amazonLastUpdated.Time
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

// CreateGiftSuggestion creates a new gift suggestion (manual or AI-generated)
func (gec *GiftEventController) CreateGiftSuggestion(c *gin.Context) {
	// Get user ID from context
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	var req struct {
		EventID       string `json:"event_id" binding:"required"`
		Mode          string `json:"mode" binding:"required"` // "manual" or "ai"
		NameEN        string `json:"name_en"`
		NameFR        string `json:"name_fr"`
		DescriptionEN string `json:"description_en"`
		DescriptionFR string `json:"description_fr"`
		PriceRange    string `json:"price_range"`
		Category      string `json:"category"`
		URL           string `json:"url"`
		Prompt        string `json:"prompt"` // For AI mode
		Language      string `json:"language"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body: " + err.Error()})
		return
	}

	// Validate mode (note: 'static' is only used internally, not via API)
	if req.Mode != "manual" && req.Mode != "ai" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid mode. Must be 'manual' or 'ai'"})
		return
	}

	// Verify event exists and user has access
	var eventCreatorID string
	checkQuery := `SELECT creator_id FROM events WHERE id = $1`
	err := gec.DB.QueryRow(checkQuery, req.EventID).Scan(&eventCreatorID)
	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"error": "Event not found"})
			return
		}
		fmt.Printf("Error checking event: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to verify event"})
		return
	}

	// Check if user is a participant
	userIDStr := userID.(string)
	var participantCount int
	participantQuery := `SELECT COUNT(*) FROM event_participants WHERE event_id = $1 AND user_id = $2`
	gec.DB.QueryRow(participantQuery, req.EventID, userIDStr).Scan(&participantCount)

	if participantCount == 0 && eventCreatorID != userIDStr {
		c.JSON(http.StatusForbidden, gin.H{"error": "You must be a participant of this event to add suggestions"})
		return
	}

	var suggestion models.GiftSuggestion

	if req.Mode == "manual" {
		// Validate required fields for manual mode
		if req.NameEN == "" && req.NameFR == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Name is required in at least one language"})
			return
		}
		if req.PriceRange == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Price range is required"})
			return
		}

		// Validate and sanitize URL if provided
		if req.URL != "" {
			req.URL = gec.URLValidator.SanitizeURL(req.URL)
			isValid, err := gec.URLValidator.ValidateURL(req.URL)
			if !isValid {
				errMsg := "Invalid URL"
				if err != nil {
					errMsg = fmt.Sprintf("Invalid URL: %s", err.Error())
				}
				c.JSON(http.StatusBadRequest, gin.H{"error": errMsg})
				return
			}
		}

		// Create manual suggestion
		suggestion = models.GiftSuggestion{
			ID:            uuid.NewString(),
			EventID:       req.EventID,
			OwnerID:       userIDStr,
			NameEN:        req.NameEN,
			NameFR:        req.NameFR,
			DescriptionEN: req.DescriptionEN,
			DescriptionFR: req.DescriptionFR,
			PriceRange:    req.PriceRange,
			Category:      req.Category,
			URL:           req.URL,
			GeneratedAt:   time.Now(),
			CreatedAt:     time.Now(),
			UpdatedAt:     time.Now(),
		}

		// If only one language provided, copy to the other
		if suggestion.NameEN == "" {
			suggestion.NameEN = suggestion.NameFR
		}
		if suggestion.NameFR == "" {
			suggestion.NameFR = suggestion.NameEN
		}
		if suggestion.DescriptionEN == "" {
			suggestion.DescriptionEN = suggestion.DescriptionFR
		}
		if suggestion.DescriptionFR == "" {
			suggestion.DescriptionFR = suggestion.DescriptionEN
		}
	} else {
		// AI mode
		if req.Prompt == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Prompt is required for AI mode"})
			return
		}

		// Get event details for context
		var event models.Event
		eventQuery := `
			SELECT title, description, start_date, location, giftee_persona, event_occasion
			FROM events
			WHERE id = $1
		`
		err := gec.DB.QueryRow(eventQuery, req.EventID).Scan(
			&event.Title, &event.Description, &event.StartDate,
			&event.Location, &event.GifteePersona, &event.EventOccasion,
		)
		if err != nil {
			fmt.Printf("Error fetching event details: %v\n", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch event details"})
			return
		}

		// Fetch existing suggestions to avoid duplicates
		existingSuggestions, err := gec.fetchExistingSuggestions(req.EventID)
		if err != nil {
			fmt.Printf("Error fetching existing suggestions: %v\n", err)
			// Continue with empty list if fetch fails
			existingSuggestions = []models.GiftSuggestion{}
		}

		// Prepare request for AI service with user prompt
		aiRequest := services.GiftSuggestionRequest{
			GifteePersona:    event.GifteePersona,
			EventOccasion:    event.EventOccasion,
			EventTitle:       event.Title,
			EventDate:        event.StartDate.Format("2006-01-02"),
			Location:         event.Location,
			Description:      event.Description,
			UserPrompt:       req.Prompt,
			Language:         req.Language,
			SingleSuggestion: true,
		}

		if aiRequest.Language == "" {
			aiRequest.Language = "en"
		}

		// Generate single suggestion using Mistral with similarity checking
		suggestions, err := gec.GiftSuggestionService.GenerateGiftSuggestions(aiRequest, existingSuggestions)
		if err != nil {
			fmt.Printf("Error generating gift suggestion: %v\n", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate gift suggestion"})
			return
		}

		if len(suggestions) == 0 {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "No suggestions generated"})
			return
		}

		// Take the first suggestion
		suggestion = suggestions[0]
		suggestion.ID = uuid.NewString()
		suggestion.EventID = req.EventID
		suggestion.OwnerID = userIDStr
		suggestion.GeneratedAt = time.Now()
		suggestion.CreatedAt = time.Now()
		suggestion.UpdatedAt = time.Now()
	}

	// Set creation_mode field
	suggestion.CreationMode = req.Mode

	// Set prompt if in AI mode
	if req.Mode == "ai" && req.Prompt != "" {
		suggestion.Prompt = &req.Prompt
	}

	// Insert suggestion into database
	insertQuery := `
		INSERT INTO gift_suggestions (
			id, event_id, owner_id, name_en, name_fr, description_en, description_fr,
			price_range, category, url, prompt, creation_mode, generated_at, created_at, updated_at,
			amazon_asin, amazon_affiliate_url, amazon_price, amazon_region, amazon_last_updated
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
	`

	_, err = gec.DB.Exec(insertQuery,
		suggestion.ID, suggestion.EventID, suggestion.OwnerID,
		suggestion.NameEN, suggestion.NameFR,
		suggestion.DescriptionEN, suggestion.DescriptionFR,
		suggestion.PriceRange, suggestion.Category, suggestion.URL, suggestion.Prompt, suggestion.CreationMode,
		suggestion.GeneratedAt, suggestion.CreatedAt, suggestion.UpdatedAt,
		suggestion.AmazonASIN, suggestion.AmazonAffiliateURL, suggestion.AmazonPrice,
		suggestion.AmazonRegion, suggestion.AmazonLastUpdated,
	)

	if err != nil {
		fmt.Printf("Error inserting gift suggestion: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create gift suggestion"})
		return
	}

	// Initialize vote counts for response
	suggestion.UpvoteCount = 0
	suggestion.DownvoteCount = 0

	// Set IsAffiliateLink based on Amazon URL presence
	suggestion.IsAffiliateLink = suggestion.AmazonAffiliateURL != nil && *suggestion.AmazonAffiliateURL != ""

	c.JSON(http.StatusCreated, suggestion)
}

// UpdateGiftSuggestion updates an existing gift suggestion if the user is the owner
func (gec *GiftEventController) UpdateGiftSuggestion(c *gin.Context) {
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

	var req struct {
		NameEN           string  `json:"name_en"`
		NameFR           string  `json:"name_fr"`
		DescriptionEN    string  `json:"description_en"`
		DescriptionFR    string  `json:"description_fr"`
		PriceRange       string  `json:"price_range"`
		Category         string  `json:"category"`
		URL              string  `json:"url"`
		Prompt           *string `json:"prompt"`
		CreationMode     string  `json:"creation_mode"`
		RegenerateWithAI bool    `json:"regenerate_with_ai"` // If true, regenerate with AI using new prompt
		Language         string  `json:"language"`           // Language for AI regeneration
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body: " + err.Error()})
		return
	}

	// Validate required fields
	if req.NameEN == "" && req.NameFR == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Name is required in at least one language"})
		return
	}
	if req.PriceRange == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Price range is required"})
		return
	}

	// Validate creation_mode if provided
	if req.CreationMode != "" && req.CreationMode != "manual" && req.CreationMode != "ai" && req.CreationMode != "static" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid creation_mode. Must be 'manual', 'ai', or 'static'"})
		return
	}

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
		c.JSON(http.StatusForbidden, gin.H{"error": "Only the suggestion owner can update this suggestion"})
		return
	}

	// Validate and sanitize URL if provided
	if req.URL != "" {
		req.URL = gec.URLValidator.SanitizeURL(req.URL)
		isValid, err := gec.URLValidator.ValidateURL(req.URL)
		if !isValid {
			errMsg := "Invalid URL"
			if err != nil {
				errMsg = fmt.Sprintf("Invalid URL: %s", err.Error())
			}
			c.JSON(http.StatusBadRequest, gin.H{"error": errMsg})
			return
		}
	}

	// Smart detection: If prompt changed, regenerate with AI
	nameEN := req.NameEN
	nameFR := req.NameFR
	descEN := req.DescriptionEN
	descFR := req.DescriptionFR

	// Amazon fields (only populated when regenerating with AI)
	var amazonASIN, amazonAffiliateURL, amazonPrice, amazonRegion *string
	var amazonLastUpdated *time.Time

	if req.RegenerateWithAI && req.Prompt != nil && *req.Prompt != "" {
		fmt.Printf("Regenerating gift suggestion with new prompt for suggestion %s\n", suggestionID)

		// Get the suggestion to find the event ID
		var eventID string
		eventQuery := `SELECT event_id FROM gift_suggestions WHERE id = $1`
		err := gec.DB.QueryRow(eventQuery, suggestionID).Scan(&eventID)
		if err != nil {
			fmt.Printf("Error fetching event ID: %v\n", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch event information"})
			return
		}

		// Fetch the event details for context
		var event models.Event
		eventDetailsQuery := `
			SELECT id, title, description, location, start_date, giftee_persona, event_occasion
			FROM events
			WHERE id = $1
		`
		err = gec.DB.QueryRow(eventDetailsQuery, eventID).Scan(
			&event.ID, &event.Title, &event.Description, &event.Location,
			&event.StartDate, &event.GifteePersona, &event.EventOccasion,
		)
		if err != nil {
			fmt.Printf("Error fetching event details: %v\n", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch event details"})
			return
		}

		// Fetch OTHER existing suggestions (excluding this one) to avoid duplicates
		existingSuggestions, err := gec.fetchExistingSuggestionsExcluding(eventID, suggestionID)
		if err != nil {
			fmt.Printf("Error fetching existing suggestions: %v\n", err)
			// Continue with empty list if fetch fails
			existingSuggestions = []models.GiftSuggestion{}
		}

		// Prepare request for AI service with user prompt
		aiRequest := services.GiftSuggestionRequest{
			GifteePersona:    event.GifteePersona,
			EventOccasion:    event.EventOccasion,
			EventTitle:       event.Title,
			EventDate:        event.StartDate.Format("2006-01-02"),
			Location:         event.Location,
			Description:      event.Description,
			UserPrompt:       *req.Prompt, // Dereference pointer
			Language:         req.Language,
			SingleSuggestion: true,
		}

		if aiRequest.Language == "" {
			aiRequest.Language = "en"
		}

		// Generate new suggestion using Mistral with similarity checking
		suggestions, err := gec.GiftSuggestionService.GenerateGiftSuggestions(aiRequest, existingSuggestions)
		if err != nil {
			fmt.Printf("Error regenerating gift suggestion: %v\n", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to regenerate gift suggestion with AI"})
			return
		}

		if len(suggestions) == 0 {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "AI did not generate any suggestions"})
			return
		}

		// Use the first generated suggestion to update the fields
		generated := suggestions[0]
		nameEN = generated.NameEN
		nameFR = generated.NameFR
		descEN = generated.DescriptionEN
		descFR = generated.DescriptionFR
		req.PriceRange = generated.PriceRange
		req.Category = generated.Category
		// Keep the user-provided URL if any, otherwise use generated URL
		if req.URL == "" {
			req.URL = generated.URL
		}

		// Update Amazon fields from regenerated suggestion
		amazonASIN = generated.AmazonASIN
		amazonAffiliateURL = generated.AmazonAffiliateURL
		amazonPrice = generated.AmazonPrice
		amazonRegion = generated.AmazonRegion
		amazonLastUpdated = generated.AmazonLastUpdated

		fmt.Printf("Successfully regenerated suggestion: %s\n", nameEN)
	}

	// If only one language provided, copy to the other

	if nameEN == "" {
		nameEN = nameFR
	}
	if nameFR == "" {
		nameFR = nameEN
	}
	if descEN == "" {
		descEN = descFR
	}
	if descFR == "" {
		descFR = descEN
	}

	// Build update query - only include creation_mode if provided
	var updateQuery string
	var args []interface{}

	if req.CreationMode != "" {
		updateQuery = `
			UPDATE gift_suggestions
			SET name_en = $1, name_fr = $2, description_en = $3, description_fr = $4,
				price_range = $5, category = $6, url = $7, prompt = $8, creation_mode = $9, updated_at = $10,
				amazon_asin = $11, amazon_affiliate_url = $12, amazon_price = $13, amazon_region = $14, amazon_last_updated = $15
			WHERE id = $16
		`
		args = []interface{}{
			nameEN, nameFR, descEN, descFR,
			req.PriceRange, req.Category, req.URL, req.Prompt, req.CreationMode, time.Now(),
			amazonASIN, amazonAffiliateURL, amazonPrice, amazonRegion, amazonLastUpdated, suggestionID,
		}
	} else {
		updateQuery = `
			UPDATE gift_suggestions
			SET name_en = $1, name_fr = $2, description_en = $3, description_fr = $4,
				price_range = $5, category = $6, url = $7, prompt = $8, updated_at = $9,
				amazon_asin = $10, amazon_affiliate_url = $11, amazon_price = $12, amazon_region = $13, amazon_last_updated = $14
			WHERE id = $15
		`
		args = []interface{}{
			nameEN, nameFR, descEN, descFR,
			req.PriceRange, req.Category, req.URL, req.Prompt, time.Now(),
			amazonASIN, amazonAffiliateURL, amazonPrice, amazonRegion, amazonLastUpdated, suggestionID,
		}
	}

	result, err := gec.DB.Exec(updateQuery, args...)
	if err != nil {
		fmt.Printf("Error updating gift suggestion: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update suggestion"})
		return
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Gift suggestion not found"})
		return
	}

	// Fetch and return the updated suggestion
	var suggestion models.GiftSuggestion
	var prompt sql.NullString
	var fetchAmazonASIN, fetchAmazonAffiliateURL, fetchAmazonPrice, fetchAmazonRegion sql.NullString
	var fetchAmazonLastUpdated sql.NullTime
	fetchQuery := `
		SELECT id, event_id, owner_id, name_en, name_fr, description_en, description_fr,
			   price_range, category, url, prompt, creation_mode, generated_at, created_at, updated_at,
			   amazon_asin, amazon_affiliate_url, amazon_price, amazon_region, amazon_last_updated
		FROM gift_suggestions
		WHERE id = $1
	`
	err = gec.DB.QueryRow(fetchQuery, suggestionID).Scan(
		&suggestion.ID, &suggestion.EventID, &suggestion.OwnerID,
		&suggestion.NameEN, &suggestion.NameFR, &suggestion.DescriptionEN, &suggestion.DescriptionFR,
		&suggestion.PriceRange, &suggestion.Category, &suggestion.URL, &prompt, &suggestion.CreationMode,
		&suggestion.GeneratedAt, &suggestion.CreatedAt, &suggestion.UpdatedAt,
		&fetchAmazonASIN, &fetchAmazonAffiliateURL, &fetchAmazonPrice, &fetchAmazonRegion, &fetchAmazonLastUpdated,
	)

	// Handle nullable prompt field
	if prompt.Valid {
		suggestion.Prompt = &prompt.String
	}

	// Handle nullable Amazon fields
	if fetchAmazonASIN.Valid {
		suggestion.AmazonASIN = &fetchAmazonASIN.String
	}
	if fetchAmazonAffiliateURL.Valid {
		suggestion.AmazonAffiliateURL = &fetchAmazonAffiliateURL.String
		suggestion.IsAffiliateLink = true
	}
	if fetchAmazonPrice.Valid {
		suggestion.AmazonPrice = &fetchAmazonPrice.String
	}
	if fetchAmazonRegion.Valid {
		suggestion.AmazonRegion = &fetchAmazonRegion.String
	}
	if fetchAmazonLastUpdated.Valid {
		suggestion.AmazonLastUpdated = &fetchAmazonLastUpdated.Time
	}

	if err != nil {
		fmt.Printf("Error fetching updated suggestion: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Suggestion updated but failed to fetch"})
		return
	}

	// Get vote counts
	var upvotes, downvotes int
	voteQuery := `
		SELECT
			COUNT(*) FILTER (WHERE vote_type = 'upvote') as upvotes,
			COUNT(*) FILTER (WHERE vote_type = 'downvote') as downvotes
		FROM gift_suggestion_votes
		WHERE suggestion_id = $1
	`
	gec.DB.QueryRow(voteQuery, suggestionID).Scan(&upvotes, &downvotes)
	suggestion.UpvoteCount = upvotes
	suggestion.DownvoteCount = downvotes

	c.JSON(http.StatusOK, suggestion)
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
