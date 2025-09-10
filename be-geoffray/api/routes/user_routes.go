package routes

import (
	"be-geoffray/api/controllers"
	"github.com/gin-gonic/gin"
)

// RegisterUserRoutes sets up user routes
func RegisterUserRoutes(r *gin.RouterGroup) {
	// User routes
	r.GET("/profile", controllers.GetUserProfile)
	r.PUT("/profile", controllers.UpdateUserProfile)
}
