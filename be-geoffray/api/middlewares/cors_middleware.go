// cors_middleware.go
package middlewares

import (
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

// CORSMiddleware returns a configured CORS middleware
func CORSMiddleware() gin.HandlerFunc {
	return cors.New(cors.Config{
		// Use wildcard origin for development to avoid issues
		AllowOrigins:     []string{"*"},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization", "Cache-Control", "X-Requested-With"},
		ExposeHeaders:    []string{"Content-Length", "Content-Type"},
		AllowCredentials: false, // Must be false when using wildcard (*) origin
		MaxAge:           12 * time.Hour,
	})
}
