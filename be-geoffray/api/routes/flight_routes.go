package routes

import (
	"be-geoffray/api/controllers"
	"github.com/gin-gonic/gin"
)

// RegisterFlightRoutes registers flight inspiration routes on the provided RouterGroup.
func RegisterFlightRoutes(rg *gin.RouterGroup) {
	rg.POST("/flight-inspiration", controllers.FlightInspirationHandler)
}
