package routes

import (
	"be-geoffray/api/controllers"
	"github.com/gin-gonic/gin"
)

// RegisterEventMessagesRoutes registers all event message-related routes
func RegisterEventMessagesRoutes(r *gin.RouterGroup) {
	messages := r.Group("/events/:id/messages")

	// Event message routes
	messages.GET("/", controllers.GetEventMessages)    // Get all messages for an event
	messages.POST("/", controllers.CreateEventMessage) // Create a new message for an event
}
