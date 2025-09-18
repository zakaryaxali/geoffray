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
}
