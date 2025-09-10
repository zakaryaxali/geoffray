package controllers

import (
	"net/http"

	"be-geoffray/localization"
	"github.com/gin-gonic/gin"
)

// LocalizationController handles translation-related API endpoints
type LocalizationController struct {
	service *localization.Service
}

// NewLocalizationController creates a new localization controller
func NewLocalizationController() *LocalizationController {
	return &LocalizationController{
		service: localization.NewService(),
	}
}

// GetTranslations handles the request to get translations for a specific language
func (c *LocalizationController) GetTranslations(ctx *gin.Context) {
	// Get language code from query parameter
	languageCode := ctx.Query("lang")

	// If language code is not provided, try to detect it from the Accept-Language header
	if languageCode == "" {
		acceptLanguage := ctx.GetHeader("Accept-Language")
		languageCode = localization.DetectLanguage(acceptLanguage)
	}

	// Get translations from service
	translations, err := c.service.GetTranslations(languageCode)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to retrieve translations: " + err.Error(),
		})
		return
	}

	// Return translations
	ctx.JSON(http.StatusOK, translations)
}

// ImportTranslations handles the request to import translations from JSON files
func (c *LocalizationController) ImportTranslations(ctx *gin.Context) {
	// This endpoint is for admin use only, so it should be protected
	// Import translations from the translations directory
	err := c.service.ImportTranslationsFromJSON("./localization/translations")
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to import translations: " + err.Error(),
		})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"message": "Translations imported successfully",
	})
}
