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
	amazonService  *AmazonService
}

// NewGiftSuggestionService creates a new gift suggestion service
func NewGiftSuggestionService() *GiftSuggestionService {
	return &GiftSuggestionService{
		mistralAPIKey:  os.Getenv("MISTRAL_API_KEY"),
		mistralAgentID: os.Getenv("MISTRAL_AGENT_ID"),
		mistralURL:     "https://api.mistral.ai/v1/conversations",
		amazonService:  NewAmazonService(),
	}
}

// MistralConversationRequest matches the exact working format
type MistralConversationRequest struct {
	AgentID string           `json:"agent_id"`
	Stream  bool             `json:"stream"`
	Inputs  []MistralMessage `json:"inputs"`
}

// GenerateGiftSuggestions generates gift suggestions using Mistral AI Agent with similarity checking
func (g *GiftSuggestionService) GenerateGiftSuggestions(request GiftSuggestionRequest, existingSuggestions []models.GiftSuggestion) ([]models.GiftSuggestion, error) {
	if g.mistralAPIKey == "" {
		return nil, fmt.Errorf("MISTRAL_API_KEY not configured")
	}

	if g.mistralAgentID == "" {
		return nil, fmt.Errorf("MISTRAL_AGENT_ID not configured")
	}

	const maxRetries = 3
	var validSuggestions []models.GiftSuggestion
	allExistingSuggestions := make([]models.GiftSuggestion, len(existingSuggestions))
	copy(allExistingSuggestions, existingSuggestions)

	for attempt := 1; attempt <= maxRetries; attempt++ {
		fmt.Printf("Gift suggestion generation attempt %d/%d\n", attempt, maxRetries)

		// Generate suggestions with current exclusion list
		suggestions, err := g.generateSuggestionsAttempt(request, allExistingSuggestions)
		if err != nil {
			return nil, err
		}

		// Validate each suggestion for similarity
		for _, suggestion := range suggestions {
			isSimilar, reason, err := g.CheckSimilarity(suggestion, allExistingSuggestions, request.Language)
			if err != nil {
				fmt.Printf("Warning: similarity check failed: %v\n", err)
				// On similarity check error, accept the suggestion (fail open)
				validSuggestions = append(validSuggestions, suggestion)
				continue
			}

			if isSimilar {
				fmt.Printf("Rejected similar suggestion: %s. Reason: %s\n", suggestion.NameEN, reason)
				// Add to exclusion list for next retry
				allExistingSuggestions = append(allExistingSuggestions, suggestion)
			} else {
				fmt.Printf("Accepted unique suggestion: %s\n", suggestion.NameEN)
				validSuggestions = append(validSuggestions, suggestion)
				// Also add to exclusion list to avoid duplicates within this batch
				allExistingSuggestions = append(allExistingSuggestions, suggestion)
			}
		}

		// Calculate how many suggestions we still need
		targetCount := 1
		if !request.SingleSuggestion {
			targetCount = 2 // Aim for at least 2 suggestions
		}

		if len(validSuggestions) >= targetCount {
			fmt.Printf("Successfully generated %d valid suggestions\n", len(validSuggestions))
			break
		}

		if attempt < maxRetries {
			fmt.Printf("Only got %d/%d suggestions, retrying...\n", len(validSuggestions), targetCount)
		}
	}

	if len(validSuggestions) == 0 {
		return nil, fmt.Errorf("failed to generate unique suggestions after %d attempts", maxRetries)
	}

	// Enrich suggestions with Amazon affiliate data
	g.enrichWithAmazonData(validSuggestions, request.Language)

	return validSuggestions, nil
}

// generateSuggestionsAttempt makes a single attempt to generate suggestions
func (g *GiftSuggestionService) generateSuggestionsAttempt(request GiftSuggestionRequest, existingSuggestions []models.GiftSuggestion) ([]models.GiftSuggestion, error) {
	// Create the prompt for gift suggestions
	prompt := g.buildGiftSuggestionPrompt(request, existingSuggestions)

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
	fmt.Printf("Mistral API extracted content length: %d\n", len(content))

	suggestions, err := g.parseGiftSuggestions(content)
	if err != nil {
		fmt.Printf("Error parsing gift suggestions. Content length: %d\n", len(content))
		return nil, fmt.Errorf("failed to parse gift suggestions: %w", err)
	}

	return suggestions, nil
}

// buildGiftSuggestionPrompt creates the prompt for Mistral
func (g *GiftSuggestionService) buildGiftSuggestionPrompt(request GiftSuggestionRequest, existingSuggestions []models.GiftSuggestion) string {
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

	// Add existing suggestions to avoid
	if len(existingSuggestions) > 0 {
		prompt.WriteString("\n⚠️ AVOID THESE EXISTING SUGGESTIONS - Do not generate similar gifts:\n")
		for i, existing := range existingSuggestions {
			// Use appropriate language fields
			name := existing.NameEN
			desc := existing.DescriptionEN
			if request.Language == "fr" {
				name = existing.NameFR
				desc = existing.DescriptionFR
			}

			prompt.WriteString(fmt.Sprintf("%d. %s (Category: %s)\n", i+1, name, existing.Category))
			if desc != "" {
				prompt.WriteString(fmt.Sprintf("   Description: %s\n", desc))
			}
		}
		prompt.WriteString("\nYour new suggestions MUST be different in category OR name OR description from all the above.\n")
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
      "url": ""
    }
  ]
}`)

	prompt.WriteString("\n\nIMPORTANT RULES:\n")
	prompt.WriteString("- Both English and French names/descriptions are provided\n")
	prompt.WriteString("- Price ranges are realistic and in Euros\n")
	prompt.WriteString("- Categories are specific (Books, Electronics, Fashion, Home, Sports, Kitchen, etc.)\n")
	prompt.WriteString("- URL field: LEAVE EMPTY (just use empty string \"\") - DO NOT create fake URLs\n")
	prompt.WriteString("- NEVER generate example URLs like https://example.com or https://amazon.fr/fake-product\n")
	prompt.WriteString("- DO NOT invent product IDs or links that don't exist\n")
	prompt.WriteString("- Focus on describing the gift well so users can search for it themselves\n")
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

// CheckSimilarity checks if a new suggestion is too similar to existing ones
// Uses Mistral AI to perform semantic similarity detection on category, name, and description
func (g *GiftSuggestionService) CheckSimilarity(newSuggestion models.GiftSuggestion, existingSuggestions []models.GiftSuggestion, language string) (bool, string, error) {
	if g.mistralAPIKey == "" {
		// If Mistral is not configured, skip similarity check
		return false, "", nil
	}

	if len(existingSuggestions) == 0 {
		// No existing suggestions to compare against
		return false, "", nil
	}

	// Build comparison prompt
	prompt := g.buildSimilarityCheckPrompt(newSuggestion, existingSuggestions, language)

	// Use Mistral Chat API for faster responses
	mistralRequest := MistralGiftChatRequest{
		Model:       "mistral-large-latest",
		MaxTokens:   500,
		Temperature: 0.0, // Low temperature for consistent similarity checks
		Stream:      false,
		Messages: []MistralMessage{
			{
				Role:    "user",
				Content: prompt,
			},
		},
	}

	requestBody, err := json.Marshal(mistralRequest)
	if err != nil {
		return false, "", fmt.Errorf("failed to marshal similarity check request: %w", err)
	}

	// Make HTTP request to Mistral Chat API
	chatURL := "https://api.mistral.ai/v1/chat/completions"
	req, err := http.NewRequest("POST", chatURL, bytes.NewBuffer(requestBody))
	if err != nil {
		return false, "", fmt.Errorf("failed to create similarity check request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+g.mistralAPIKey)

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return false, "", fmt.Errorf("failed to make similarity check request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return false, "", fmt.Errorf("mistral similarity check API error %d: %s", resp.StatusCode, string(body))
	}

	// Parse response
	responseBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return false, "", fmt.Errorf("failed to read similarity check response: %w", err)
	}

	var chatResponse MistralGiftChatResponse
	if err := json.Unmarshal(responseBody, &chatResponse); err != nil {
		return false, "", fmt.Errorf("failed to parse similarity check response: %w", err)
	}

	if len(chatResponse.Choices) == 0 {
		return false, "", fmt.Errorf("no response from Mistral similarity check")
	}

	// Parse the AI's response
	aiResponse := strings.TrimSpace(chatResponse.Choices[0].Message.Content)
	fmt.Printf("Similarity check response: %s\n", aiResponse)

	// Check if AI says it's similar
	isSimilar := strings.Contains(strings.ToUpper(aiResponse), "YES") ||
		strings.Contains(strings.ToUpper(aiResponse), "SIMILAR")

	return isSimilar, aiResponse, nil
}

// buildSimilarityCheckPrompt creates a prompt for checking similarity
func (g *GiftSuggestionService) buildSimilarityCheckPrompt(newSuggestion models.GiftSuggestion, existingSuggestions []models.GiftSuggestion, language string) string {
	var prompt strings.Builder

	prompt.WriteString("You are a gift suggestion similarity checker. Analyze if the NEW suggestion is too similar to any EXISTING suggestions.\n\n")
	prompt.WriteString("A suggestion is TOO SIMILAR if it matches in category AND (name OR description are semantically similar).\n\n")

	// Get the appropriate name and description based on language
	newName := newSuggestion.NameEN
	newDesc := newSuggestion.DescriptionEN
	if language == "fr" {
		newName = newSuggestion.NameFR
		newDesc = newSuggestion.DescriptionFR
	}

	prompt.WriteString("NEW SUGGESTION:\n")
	prompt.WriteString(fmt.Sprintf("- Category: %s\n", newSuggestion.Category))
	prompt.WriteString(fmt.Sprintf("- Name: %s\n", newName))
	prompt.WriteString(fmt.Sprintf("- Description: %s\n\n", newDesc))

	prompt.WriteString("EXISTING SUGGESTIONS:\n")
	for i, existing := range existingSuggestions {
		existingName := existing.NameEN
		existingDesc := existing.DescriptionEN
		if language == "fr" {
			existingName = existing.NameFR
			existingDesc = existing.DescriptionFR
		}

		prompt.WriteString(fmt.Sprintf("%d. Category: %s\n", i+1, existing.Category))
		prompt.WriteString(fmt.Sprintf("   Name: %s\n", existingName))
		prompt.WriteString(fmt.Sprintf("   Description: %s\n\n", existingDesc))
	}

	prompt.WriteString("Answer with ONLY 'YES' if the new suggestion is too similar to any existing suggestion, or 'NO' if it's sufficiently different.\n")
	prompt.WriteString("You may add a brief reason after your YES/NO answer.\n")

	return prompt.String()
}

// enrichWithAmazonData adds Amazon affiliate links to suggestions
// This is best-effort: failures don't block suggestion creation
func (g *GiftSuggestionService) enrichWithAmazonData(suggestions []models.GiftSuggestion, language string) {
	if g.amazonService == nil {
		fmt.Println("Amazon service not initialized, skipping enrichment")
		return
	}

	if !g.amazonService.IsEnabled() {
		fmt.Println("Amazon service not enabled, using fallback search URLs")
		// Still generate search URLs as fallback
		region := MapLanguageToRegion(language)
		for i := range suggestions {
			name := suggestions[i].NameEN
			if language == "fr" {
				name = suggestions[i].NameFR
			}
			searchURL := g.amazonService.GenerateSearchURL(name, region)
			suggestions[i].AmazonAffiliateURL = &searchURL
			suggestions[i].AmazonRegion = &region
			now := time.Now()
			suggestions[i].AmazonLastUpdated = &now
			suggestions[i].IsAffiliateLink = true
		}
		return
	}

	region := MapLanguageToRegion(language)

	for i := range suggestions {
		// Use appropriate language name for search
		name := suggestions[i].NameEN
		if language == "fr" {
			name = suggestions[i].NameFR
		}

		// Try to enrich with Amazon data
		affiliateURL, price, asin, err := g.amazonService.EnrichWithAmazonData(name, suggestions[i].Category, region)
		if err != nil {
			fmt.Printf("Warning: Amazon enrichment failed for suggestion '%s': %v\n", name, err)
			// Still use fallback search URL
			searchURL := g.amazonService.GenerateSearchURL(name, region)
			suggestions[i].AmazonAffiliateURL = &searchURL
		} else {
			suggestions[i].AmazonAffiliateURL = &affiliateURL
			if price != "" {
				suggestions[i].AmazonPrice = &price
			}
			if asin != "" {
				suggestions[i].AmazonASIN = &asin
			}
		}

		suggestions[i].AmazonRegion = &region
		now := time.Now()
		suggestions[i].AmazonLastUpdated = &now
		suggestions[i].IsAffiliateLink = suggestions[i].AmazonAffiliateURL != nil && *suggestions[i].AmazonAffiliateURL != ""
	}
}
