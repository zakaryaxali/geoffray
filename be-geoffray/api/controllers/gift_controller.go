package controllers

import (
	"database/sql"
	"net/http"
	"time"

	"be-geoffray/models"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// GiftController handles gift-related operations
type GiftController struct {
	DB *sql.DB
}

// NewGiftController creates a new gift controller
func NewGiftController(db *sql.DB) *GiftController {
	return &GiftController{DB: db}
}

// GetCategories retrieves all active giftee personas
func (gc *GiftController) GetCategories(c *gin.Context) {
	query := `
		SELECT id, persona_key, color, order_index, active, created_at, updated_at
		FROM giftee_personas
		WHERE active = true
		ORDER BY order_index ASC
	`

	rows, err := gc.DB.Query(query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch giftee personas"})
		return
	}
	defer rows.Close()

	var personas []models.GifteePersona
	for rows.Next() {
		var persona models.GifteePersona
		err := rows.Scan(
			&persona.ID,
			&persona.PersonaKey,
			&persona.Color,
			&persona.OrderIndex,
			&persona.Active,
			&persona.CreatedAt,
			&persona.UpdatedAt,
		)
		if err != nil {
			continue
		}
		personas = append(personas, persona)
	}

	c.JSON(http.StatusOK, personas)
}

// GetSuggestions retrieves gift suggestions for an event
func (gc *GiftController) GetSuggestions(c *gin.Context) {
	eventID := c.Query("event_id")

	if eventID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "event_id is required"})
		return
	}

	query := `
		SELECT id, event_id, name_en, name_fr, description_en, description_fr,
			   price_range, category, url, generated_at, created_at, updated_at
		FROM gift_suggestions
		WHERE event_id = $1
		ORDER BY created_at DESC
	`

	rows, err := gc.DB.Query(query, eventID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch gift suggestions"})
		return
	}
	defer rows.Close()

	var suggestions []models.GiftSuggestion
	for rows.Next() {
		var suggestion models.GiftSuggestion
		err := rows.Scan(
			&suggestion.ID,
			&suggestion.EventID,
			&suggestion.NameEN,
			&suggestion.NameFR,
			&suggestion.DescriptionEN,
			&suggestion.DescriptionFR,
			&suggestion.PriceRange,
			&suggestion.Category,
			&suggestion.URL,
			&suggestion.GeneratedAt,
			&suggestion.CreatedAt,
			&suggestion.UpdatedAt,
		)
		if err != nil {
			continue
		}
		suggestions = append(suggestions, suggestion)
	}

	c.JSON(http.StatusOK, suggestions)
}

// TrackSelection tracks a user's gift category selection
func (gc *GiftController) TrackSelection(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	var request struct {
		CategoryID string  `json:"category_id" binding:"required"`
		EventID    *string `json:"event_id"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Create selection record
	selectionID := uuid.New().String()
	query := `
		INSERT INTO gift_selections (id, user_id, category_id, event_id, created_at)
		VALUES ($1, $2, $3, $4, $5)
	`

	_, err := gc.DB.Exec(query, selectionID, userID, request.CategoryID, request.EventID, time.Now())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to track selection"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Selection tracked successfully",
		"id":      selectionID,
	})
}
