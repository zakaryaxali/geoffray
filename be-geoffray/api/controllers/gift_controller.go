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

// GetCategories retrieves all active gift categories
func (gc *GiftController) GetCategories(c *gin.Context) {
	query := `
		SELECT id, name_key, color, order_index, active, created_at, updated_at
		FROM gift_categories
		WHERE active = true
		ORDER BY order_index ASC
	`

	rows, err := gc.DB.Query(query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch gift categories"})
		return
	}
	defer rows.Close()

	var categories []models.GiftCategory
	for rows.Next() {
		var category models.GiftCategory
		err := rows.Scan(
			&category.ID,
			&category.NameKey,
			&category.Color,
			&category.OrderIndex,
			&category.Active,
			&category.CreatedAt,
			&category.UpdatedAt,
		)
		if err != nil {
			continue
		}
		categories = append(categories, category)
	}

	c.JSON(http.StatusOK, categories)
}

// GetSuggestions retrieves gift suggestions for a category
func (gc *GiftController) GetSuggestions(c *gin.Context) {
	categoryID := c.Query("category_id")
	eventID := c.Query("event_id")

	if categoryID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "category_id is required"})
		return
	}

	query := `
		SELECT id, category_id, event_id, name, description, price_range, 
			   url, image_url, created_at, updated_at
		FROM gift_suggestions
		WHERE category_id = $1
	`

	args := []interface{}{categoryID}

	// Add event filter if provided
	if eventID != "" {
		query += " AND (event_id = $2 OR event_id IS NULL)"
		args = append(args, eventID)
	} else {
		query += " AND event_id IS NULL"
	}

	query += " ORDER BY created_at DESC"

	rows, err := gc.DB.Query(query, args...)
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
			&suggestion.CategoryID,
			&suggestion.EventID,
			&suggestion.Name,
			&suggestion.Description,
			&suggestion.PriceRange,
			&suggestion.URL,
			&suggestion.ImageURL,
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
