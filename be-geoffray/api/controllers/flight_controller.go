package controllers

import (
	"net/http"

	"be-geoffray/services"
	"github.com/gin-gonic/gin"
)

type FlightInspirationRequest struct {
	Origin        string `json:"origin" binding:"required"`
	DepartureDate string `json:"departureDate,omitempty"`
	MaxPrice      *int   `json:"maxPrice,omitempty"`
	OneWay        *bool  `json:"oneWay,omitempty"`
	NonStop       *bool  `json:"nonStop,omitempty"`
}

func FlightInspirationHandler(c *gin.Context) {
	var req FlightInspirationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request: " + err.Error()})
		return
	}
	if req.Origin == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "origin is required"})
		return
	}
	if req.MaxPrice != nil && *req.MaxPrice <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "maxPrice must be positive"})
		return
	}
	options, err := services.GetFlightInspiration(req.Origin, req.DepartureDate, req.MaxPrice, req.OneWay, req.NonStop)
	if err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"flights": options})
}
