package routes

import (
	"be-geoffray/api/controllers"
	"be-geoffray/api/middlewares"
	"github.com/gin-gonic/gin"
)

// RegisterLocalizationRoutes registers routes for localization
func RegisterLocalizationRoutes(router *gin.RouterGroup) {
	controller := controllers.NewLocalizationController()

	// Apply language middleware to all routes in this group
	router.Use(middlewares.LanguageMiddleware())

	// Public endpoint to get translations
	router.GET("/translations", controller.GetTranslations)

	// Admin endpoint to import translations (should be protected in production)
	router.POST("/translations/import", controller.ImportTranslations)
}
