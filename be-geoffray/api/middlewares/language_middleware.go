package middlewares

import (
	"be-geoffray/localization"
	"github.com/gin-gonic/gin"
)

// LanguageMiddleware detects the user's preferred language and sets it in the context
func LanguageMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// First, check if language is specified in query parameter
		languageCode := c.Query("lang")

		// If not in query, try to detect from Accept-Language header
		if languageCode == "" {
			acceptLanguage := c.GetHeader("Accept-Language")
			languageCode = localization.DetectLanguage(acceptLanguage)
		}

		// Set language in context for later use
		c.Set("language", languageCode)

		// Continue processing the request
		c.Next()
	}
}
