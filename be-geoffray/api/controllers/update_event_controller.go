package controllers

import (
	"log"
	"net/http"
	"time"

	"be-geoffray/services"
	"github.com/gin-gonic/gin"
)

// UpdateEventInput represents the request body for updating an event
type UpdateEventInput struct {
	Title         *string    `json:"title"`
	Description   *string    `json:"description"`
	StartDate     *time.Time `json:"start_date"`
	EndDate       *time.Time `json:"end_date"`
	Location      *string    `json:"location"`
	RemoveEndDate *bool      `json:"remove_end_date"`
}

// UpdateEvent handles updating an existing event's details
// Only the event creator can update the event
func UpdateEvent(c *gin.Context) {
	// Get the user ID from the authenticated context
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Get the event ID from the URL parameter
	eventID := c.Param("id")
	if eventID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Event ID is required"})
		return
	}

	// Parse the request body
	var input UpdateEventInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Ensure at least one field is being updated
	if input.Title == nil && input.Description == nil && input.StartDate == nil && input.EndDate == nil && input.Location == nil && input.RemoveEndDate == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "At least one field must be provided for update"})
		return
	}

	// Initialize the event service
	eventService := services.NewEventService()

	// Create a map of updates to pass to the service
	updates := make(map[string]interface{})
	if input.Title != nil {
		updates["title"] = *input.Title
	}
	if input.Description != nil {
		updates["description"] = *input.Description
	}
	if input.StartDate != nil {
		updates["start_date"] = *input.StartDate
	}
	if input.RemoveEndDate != nil && *input.RemoveEndDate {
		// If RemoveEndDate is true, pass this flag to the service
		updates["remove_end_date"] = true
	} else if input.EndDate != nil {
		// Otherwise, use the provided end date
		updates["end_date"] = input.EndDate
	}
	if input.Location != nil {
		updates["location"] = *input.Location
	}

	// Update the event using the service
	updatedEvent, err := eventService.UpdateEvent(eventID, userID.(string), updates)
	if err != nil {
		log.Printf("Error in UpdateEvent: %v", err)
		statusCode := http.StatusInternalServerError
		if err.Error() == "event not found" {
			statusCode = http.StatusNotFound
		} else if err.Error() == "only the event creator can update this event" {
			statusCode = http.StatusForbidden
		} else if err.Error() == "end date cannot be before start date" || err.Error() == "end date cannot be before existing start date" {
			statusCode = http.StatusBadRequest
		}
		c.JSON(statusCode, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Event updated successfully",
		"event":   updatedEvent,
	})
}
