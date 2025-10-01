package main

import (
	"log"

	"be-geoffray/api/middlewares"
	"be-geoffray/api/routes"
	"be-geoffray/config"
	"be-geoffray/db"
	"be-geoffray/localization"
	"be-geoffray/services"
	"github.com/gin-gonic/gin"
)

func main() {
	// Initialize application configuration
	// This will load environment variables and set up the config singleton
	config.GetConfig()

	// Initialize database connection with config
	db.InitDB()

	// Setup database
	db.SetupDatabase(db.DB)

	// Sync participant counts for existing events (maintenance task)
	eventService := services.NewEventService()
	if err := eventService.SyncParticipantCounts(); err != nil {
		log.Printf("Warning: Failed to sync participant counts on startup: %v", err)
	}

	// Initialize Gin router (Reads GIN_MODE env var)
	router := gin.Default()

	// Conditionally apply CORS middleware
	// Apply only if NOT in release mode (e.g., for local development)
	// In release mode (Kubernetes), Ingress handles CORS.
	if gin.Mode() != gin.ReleaseMode {
		log.Println("Applying Gin CORS middleware for non-release mode:", gin.Mode())
		router.Use(middlewares.CORSMiddleware())
	} else {
		log.Println("Skipping Gin CORS middleware in release mode (handled by Ingress)")
	}

	// Import translations on startup
	localizationService := localization.NewService()
	err := localizationService.ImportTranslationsFromJSON("./localization/translations")
	if err != nil {
		log.Printf("Warning: Failed to import translations: %v", err)
	}

	// Public routes (no JWT required)
	public := router.Group("/auth")
	{
		routes.RegisterAuthRoutes(public) // This will include /register and /login
	}

	// Health check endpoint (for Kubernetes probes)
	router.GET("/health", func(c *gin.Context) {
		// Check database connection
		err := db.DB.Ping()
		if err != nil {
			c.JSON(500, gin.H{"status": "error", "message": "Database connection failed"})
			return
		}
		c.JSON(200, gin.H{"status": "ok", "message": "Service is healthy"})
	})

	// Localization routes (no JWT required)
	localizationRoutes := router.Group("/api")
	{
		routes.RegisterLocalizationRoutes(localizationRoutes)
	}

	// Gift routes (some public, some protected)
	routes.SetupGiftRoutes(router, db.DB)

	// Protected routes (JWT required)
	protected := router.Group("/")
	protected.Use(middlewares.JWTAuthMiddleware()) // Apply JWT middleware only to protected routes
	{
		routes.RegisterUserRoutes(protected)          // Only these routes need authentication
		routes.RegisterEventRoutes(protected)         // Protected event routes
		routes.RegisterEventMessagesRoutes(protected) // Protected event messages routes
	}

	// Start server
	log.Printf("Starting server in %s mode on :8080", gin.Mode())
	router.Run(":8080")
}
