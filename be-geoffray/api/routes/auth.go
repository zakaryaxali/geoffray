package routes

import (
	"be-geoffray/api/controllers"
	"github.com/gin-gonic/gin"
)

// RegisterAuthRoutes defines routes for authentication
func RegisterAuthRoutes(r *gin.RouterGroup) {
	r.POST("/firebase", controllers.FirebaseLogin)
	r.POST("/refresh", controllers.RefreshToken)
	r.POST("/logout", controllers.Logout)
	r.GET("/validate", controllers.ValidateToken)
}
