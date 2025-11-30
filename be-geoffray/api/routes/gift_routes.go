package routes

import (
	"database/sql"

	"be-geoffray/api/controllers"
	"be-geoffray/api/middlewares"
	"github.com/gin-gonic/gin"
)

// SetupGiftRoutes sets up gift-related routes
func SetupGiftRoutes(router *gin.Engine, db *sql.DB) {
	giftController := controllers.NewGiftController(db)
	giftEventController := controllers.NewGiftEventController(db)

	// Public routes
	giftRoutes := router.Group("/api/gifts")
	{
		// Get all active gift categories
		giftRoutes.GET("/categories", giftController.GetCategories)

		// Get gift suggestions for a category
		giftRoutes.GET("/suggestions", giftController.GetSuggestions)
	}

	// Protected routes (require authentication)
	protectedGiftRoutes := router.Group("/api/gifts")
	protectedGiftRoutes.Use(middlewares.JWTAuthMiddleware())
	{
		// Track user's category selection
		protectedGiftRoutes.POST("/track-selection", giftController.TrackSelection)
	}

	// Protected event-with-gifts routes
	protectedEventGiftRoutes := router.Group("/api/events")
	protectedEventGiftRoutes.Use(middlewares.JWTAuthMiddleware())
	{
		// Create event with gift suggestions
		protectedEventGiftRoutes.POST("/with-gifts", giftEventController.CreateEventWithGifts)

		// Get gift suggestions for a specific event
		protectedEventGiftRoutes.GET("/:id/gift-suggestions", giftEventController.GetEventGiftSuggestions)

		// Regenerate gift suggestions for an event
		protectedEventGiftRoutes.POST("/:id/regenerate-gift-suggestions", giftEventController.RegenerateEventGiftSuggestions)
	}

	// Protected gift suggestion voting routes
	protectedVoteRoutes := router.Group("/api/gift-suggestions")
	protectedVoteRoutes.Use(middlewares.JWTAuthMiddleware())
	{
		// Create a new gift suggestion (manual or AI-generated)
		protectedVoteRoutes.POST("", giftEventController.CreateGiftSuggestion)

		// Vote on a gift suggestion (POST to create/update vote)
		protectedVoteRoutes.POST("/:id/vote", giftEventController.VoteOnSuggestion)

		// Remove vote from a gift suggestion
		protectedVoteRoutes.DELETE("/:id/vote", giftEventController.RemoveVote)

		// Update a gift suggestion (only owner can update)
		protectedVoteRoutes.PUT("/:id", giftEventController.UpdateGiftSuggestion)

		// Delete a gift suggestion (only owner can delete)
		protectedVoteRoutes.DELETE("/:id", giftEventController.DeleteGiftSuggestion)
	}
}
