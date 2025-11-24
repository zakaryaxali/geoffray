package routes

import (
	"database/sql"

	"be-geoffray/api/controllers"
	"be-geoffray/api/middlewares"
	"github.com/gin-gonic/gin"
)

func SetupInviteRoutes(router *gin.Engine, db *sql.DB) {
	inviteController := controllers.NewInviteController(db)

	invites := router.Group("/invites")
	{
		// Public endpoint - no authentication required
		invites.GET("/:code", inviteController.ValidateInvite)

		// Protected endpoint - requires JWT authentication
		invites.POST("/:code/accept", middlewares.JWTAuthMiddleware(), inviteController.AcceptInvite)
	}
}
