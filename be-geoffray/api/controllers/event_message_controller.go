package controllers

import (
	"fmt"
	"net/http"
	"time"

	"be-geoffray/models"
	"be-geoffray/services"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type EventMessageRequest struct {
	Content  string  `json:"content"`
	ParentID *string `json:"parent_id,omitempty"`
}

func GetEventMessages(c *gin.Context) {
	eventID := c.Param("id")
	if eventID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "event_id is required"})
		return
	}

	messages, err := services.GetEventMessages(c, eventID)
	if err != nil {
		fmt.Printf("Error getting event messages: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, messages)
}

func CreateEventMessage(c *gin.Context) {
	eventID := c.Param("id")
	if eventID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "event_id is required"})
		return
	}

	var req struct {
		Content  string  `json:"content" binding:"required"`
		ParentID *string `json:"parent_id,omitempty"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	if req.Content == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "content is required"})
		return
	}

	// Get user ID from context (set by JWT middleware)
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Fetch user using the user service
	user, err := services.GetUserByID(c, userID.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch user data"})
		return
	}

	message := models.EventMessage{
		ID:        uuid.NewString(),
		EventID:   eventID,
		UserID:    userID.(string),
		Content:   req.Content,
		ParentID:  req.ParentID,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
		User:      user,
	}

	// Check if the message is for the agent
	isForAgent := services.IsMessageForAgent(req.Content)
	message.ForAgent = isForAgent

	if err := services.CreateEventMessage(c, &message); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// If the message is for the agent, process it with Mistral AI
	if isForAgent {
		go processAgentMessage(c, eventID, message.ID)
	}

	c.JSON(http.StatusCreated, message)
}

// processAgentMessage handles sending the message to the Mistral AI agent and saving the response
func processAgentMessage(c *gin.Context, eventID string, messageID string) {
	// Delegate the processing to the service layer
	err := services.ProcessAgentMessageWithMistral(c, eventID, messageID)
	if err != nil {
		fmt.Printf("Error processing agent message: %v\n", err)
	}
}

// GetAgentMessagesForEvent retrieves all agent-related messages for a specific event
func GetAgentMessagesForEvent(c *gin.Context) {
	eventID := c.Param("id")
	if eventID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "event_id is required"})
		return
	}

	messages, err := services.GetAgentMessages(c, eventID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, messages)
}
