package controllers

import (
	"net/http"

	"be-geoffray/services"
	"github.com/gin-gonic/gin"
)

// UpdateParticipantStatusInput represents the request body for updating a participant status
type UpdateParticipantStatusInput struct {
	Status string `json:"status" binding:"required"`
}

// UpdateParticipantStatus handles updating a participant's status for an event
func UpdateParticipantStatus(c *gin.Context) {
	// Get the user ID from the authenticated context
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Get the event ID from the URL
	eventID := c.Param("id")
	if eventID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Event ID is required"})
		return
	}

	// Parse the input
	var input UpdateParticipantStatusInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Initialize the participant service
	participantService := services.NewParticipantService()

	// Update the participant status using the service
	err := participantService.UpdateParticipantStatus(eventID, userID, input.Status)
	if err != nil {
		// Handle different types of errors with appropriate status codes
		switch err.Error() {
		case "invalid status: must be 'accepted', 'pending', or 'declined'":
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		case "user is not a participant in this event":
			c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update participant status"})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Participant status updated successfully",
		"status":  input.Status,
	})
}
