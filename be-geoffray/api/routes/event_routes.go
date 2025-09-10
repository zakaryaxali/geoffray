package routes

import (
	"be-geoffray/api/controllers"
	"github.com/gin-gonic/gin"
)

// RegisterEventRoutes registers all event-related routes
func RegisterEventRoutes(r *gin.RouterGroup) {
	events := r.Group("/events")

	// Event routes
	events.POST("/", controllers.CreateEvent)
	events.GET("/me", controllers.GetUserEvents)                               // Get user's events
	events.GET("/:id", controllers.GetEventByID)                               // Get a specific event by ID
	events.PUT("/:id", controllers.UpdateEvent)                                // Update an event's details
	events.POST("/:id/participants", controllers.InviteParticipant)            // Invite a participant to an event
	events.PUT("/:id/participant-status", controllers.UpdateParticipantStatus) // Update participant status
}
