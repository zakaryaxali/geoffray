package services

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
	"time"

	"be-geoffray/models"
)

// GiftSuggestionRequest represents the data needed to generate gift suggestions
type GiftSuggestionRequest struct {
	GifteePersona    string `json:"giftee_persona"`
	EventOccasion    string `json:"event_occasion"`
	EventTitle       string `json:"event_title"`
	EventDate        string `json:"event_date"`
	Location         string `json:"location,omitempty"`
	Description      string `json:"description,omitempty"`
	Language         string `json:"language"`              // "en" or "fr"
	UserPrompt       string `json:"user_prompt,omitempty"` // Optional user-provided prompt
	SingleSuggestion bool   `json:"single_suggestion"`     // Generate only one suggestion
}

// MistralGiftSuggestion represents a single gift suggestion from Mistral
type MistralGiftSuggestion struct {
	NameEN        string `json:"name_en"`
	NameFR        string `json:"name_fr"`
	DescriptionEN string `json:"description_en"`
	DescriptionFR string `json:"description_fr"`
	PriceRange    string `json:"price_range"`
	Category      string `json:"category"`
	URL           string `json:"url,omitempty"`
}

// MistralGiftResponse represents the response from Mistral API
type MistralGiftResponse struct {
	Suggestions []MistralGiftSuggestion `json:"suggestions"`
}

// MistralChatRequest for gift suggestion generation (simplified)
type MistralGiftChatRequest struct {
	Model       string           `json:"model"`
	Messages    []MistralMessage `json:"messages"`
	MaxTokens   int              `json:"max_tokens"`
	Temperature float64          `json:"temperature"`
	Stream      bool             `json:"stream"`
}

// MistralChatResponse for gift suggestions (kept for potential fallback)
type MistralGiftChatResponse struct {
	ID      string `json:"id"`
	Object  string `json:"object"`
	Created int64  `json:"created"`
	Model   string `json:"model"`
	Choices []struct {
		Index   int `json:"index"`
		Message struct {
			Role    string `json:"role"`
			Content string `json:"content"`
		} `json:"message"`
		FinishReason string `json:"finish_reason"`
	} `json:"choices"`
	Usage struct {
		PromptTokens     int `json:"prompt_tokens"`
		CompletionTokens int `json:"completion_tokens"`
		TotalTokens      int `json:"total_tokens"`
	} `json:"usage"`
}

// MistralConversationResponse for Conversations API
type MistralConversationResponse struct {
	Object         string `json:"object"`
	ConversationID string `json:"conversation_id"`
	Outputs        []struct {
		Object      string `json:"object"`
		Type        string `json:"type"`
		CreatedAt   string `json:"created_at"`
		CompletedAt string `json:"completed_at"`
		ID          string `json:"id"`
		AgentID     string `json:"agent_id"`
		Model       string `json:"model"`
		Role        string `json:"role"`
		Content     string `json:"content"`
	} `json:"outputs"`
	Usage struct {
		PromptTokens     int `json:"prompt_tokens"`
		CompletionTokens int `json:"completion_tokens"`
		TotalTokens      int `json:"total_tokens"`
	} `json:"usage"`
}

// GiftSuggestionService handles gift suggestion generation
type GiftSuggestionService struct {
	mistralAPIKey  string
	mistralAgentID string
	mistralURL     string
}

// NewGiftSuggestionService creates a new gift suggestion service
func NewGiftSuggestionService() *GiftSuggestionService {
	return &GiftSuggestionService{
		mistralAPIKey:  os.Getenv("MISTRAL_API_KEY"),
		mistralAgentID: os.Getenv("MISTRAL_AGENT_ID"),
		mistralURL:     "https://api.mistral.ai/v1/conversations",
	}
}

// MistralConversationRequest matches the exact working format
type MistralConversationRequest struct {
	AgentID string           `json:"agent_id"`
	Stream  bool             `json:"stream"`
	Inputs  []MistralMessage `json:"inputs"`
}

// GenerateGiftSuggestions generates gift suggestions using Mistral AI Agent
func (g *GiftSuggestionService) GenerateGiftSuggestions(request GiftSuggestionRequest) ([]models.GiftSuggestion, error) {
	if g.mistralAPIKey == "" {
		return nil, fmt.Errorf("MISTRAL_API_KEY not configured")
	}

	if g.mistralAgentID == "" {
		return nil, fmt.Errorf("MISTRAL_AGENT_ID not configured")
	}

	// Create the prompt for gift suggestions
	prompt := g.buildGiftSuggestionPrompt(request)

	// Prepare Mistral Conversations API request matching working curl format
	mistralRequest := MistralConversationRequest{
		AgentID: g.mistralAgentID,
		Stream:  false,
		Inputs: []MistralMessage{
			{
				Role:    "user",
				Content: prompt,
			},
		},
	}

	// Convert to JSON
	requestBody, err := json.Marshal(mistralRequest)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request: %w", err)
	}

	// Use conversations endpoint directly (no agent ID in URL)
	fmt.Printf("Making request to Mistral Conversations URL: %s\n", g.mistralURL)
	fmt.Printf("Request body: %s\n", string(requestBody))

	// Make HTTP request to Mistral
	req, err := http.NewRequest("POST", g.mistralURL, bytes.NewBuffer(requestBody))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+g.mistralAPIKey)

	client := &http.Client{Timeout: 120 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to make request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("mistral API error %d: %s", resp.StatusCode, string(body))
	}

	// Read response
	responseBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	// Log raw response for debugging
	fmt.Printf("Mistral API Response Status: %d\n", resp.StatusCode)
	fmt.Printf("Mistral API Raw Response: %s\n", string(responseBody))

	// Parse Mistral Conversations API response
	var mistralResponse MistralConversationResponse
	if err := json.Unmarshal(responseBody, &mistralResponse); err != nil {
		fmt.Printf("Failed to parse as MistralConversationResponse: %v\n", err)
		return nil, fmt.Errorf("failed to parse response: %w", err)
	}

	if len(mistralResponse.Outputs) == 0 {
		return nil, fmt.Errorf("no response from Mistral")
	}

	// Extract and parse the JSON suggestions from the response content
	content := mistralResponse.Outputs[0].Content
	fmt.Printf("Mistral API extracted content: %s\n", content)

	suggestions, err := g.parseGiftSuggestions(content)
	if err != nil {
		fmt.Printf("Error parsing gift suggestions. Content length: %d, Content: %s\n", len(content), content)
		return nil, fmt.Errorf("failed to parse gift suggestions: %w", err)
	}

	return suggestions, nil
}

// buildGiftSuggestionPrompt creates the prompt for Mistral
func (g *GiftSuggestionService) buildGiftSuggestionPrompt(request GiftSuggestionRequest) string {
	var prompt strings.Builder

	// Determine the number of suggestions to generate
	numSuggestions := "2-3"
	if request.SingleSuggestion {
		numSuggestions = "1"
	}

	// Handle user-provided prompt
	if request.UserPrompt != "" {
		prompt.WriteString(fmt.Sprintf("Generate %s gift suggestion(s) based on this user request:\n", numSuggestions))
		prompt.WriteString(fmt.Sprintf("User Request: %s\n\n", request.UserPrompt))
		prompt.WriteString(fmt.Sprintf("Context - Persona: %s, Occasion: %s\n\n", request.GifteePersona, request.EventOccasion))
	} else {
		prompt.WriteString(fmt.Sprintf("Generate %s gift suggestions for %s for %s.\n\n", numSuggestions, request.GifteePersona, request.EventOccasion))
	}

	prompt.WriteString("Event Details:\n")
	prompt.WriteString(fmt.Sprintf("- Title: %s\n", request.EventTitle))
	prompt.WriteString(fmt.Sprintf("- Date: %s\n", request.EventDate))

	if request.Location != "" {
		prompt.WriteString(fmt.Sprintf("- Location: %s\n", request.Location))
	}

	if request.Description != "" {
		prompt.WriteString(fmt.Sprintf("- Description: %s\n", request.Description))
	}

	prompt.WriteString("\nReturn suggestions in this exact JSON format:\n")
	prompt.WriteString(`{
  "suggestions": [
    {
      "name_en": "English gift name",
      "name_fr": "French gift name",
      "description_en": "English description explaining why this gift is perfect",
      "description_fr": "French description explaining why this gift is perfect",
      "price_range": "€15-30",
      "category": "Books",
      "url": "https://example.com/product"
    }
  ]
}`)

	prompt.WriteString("\n\nEnsure:\n")
	prompt.WriteString("- Both English and French names/descriptions are provided\n")
	prompt.WriteString("- Price ranges are realistic and in Euros\n")
	prompt.WriteString("- Categories are specific (Books, Electronics, Fashion, Home, etc.)\n")
	prompt.WriteString("- URLs are optional but preferred\n")
	if request.UserPrompt != "" {
		prompt.WriteString("- The suggestion closely matches the user's specific request\n")
	}
	prompt.WriteString("- Suggestions are thoughtful and appropriate for the persona and occasion\n")

	return prompt.String()
}

// parseGiftSuggestions extracts gift suggestions from Mistral's response
func (g *GiftSuggestionService) parseGiftSuggestions(content string) ([]models.GiftSuggestion, error) {
	fmt.Printf("parseGiftSuggestions called with content length: %d\n", len(content))

	// Handle empty content
	if content == "" {
		return nil, fmt.Errorf("empty content received from Mistral")
	}

	// Find JSON in the response (it might be wrapped in markdown or other text)
	start := strings.Index(content, "{")
	end := strings.LastIndex(content, "}") + 1

	if start == -1 || end == 0 {
		fmt.Printf("No JSON found in content: %s\n", content)
		return nil, fmt.Errorf("no JSON found in response")
	}

	jsonStr := content[start:end]
	fmt.Printf("Extracted JSON string: %s\n", jsonStr)

	// Parse the JSON response
	var response MistralGiftResponse
	if err := json.Unmarshal([]byte(jsonStr), &response); err != nil {
		fmt.Printf("JSON unmarshal error: %v\n", err)
		return nil, fmt.Errorf("failed to parse JSON: %w", err)
	}

	// Convert to our model format
	var suggestions []models.GiftSuggestion
	for _, mistralSugg := range response.Suggestions {
		suggestion := models.GiftSuggestion{
			NameEN:        mistralSugg.NameEN,
			NameFR:        mistralSugg.NameFR,
			DescriptionEN: mistralSugg.DescriptionEN,
			DescriptionFR: mistralSugg.DescriptionFR,
			PriceRange:    mistralSugg.PriceRange,
			Category:      mistralSugg.Category,
			URL:           mistralSugg.URL,
			GeneratedAt:   time.Now(),
			CreatedAt:     time.Now(),
			UpdatedAt:     time.Now(),
		}
		suggestions = append(suggestions, suggestion)
	}

	return suggestions, nil
}
