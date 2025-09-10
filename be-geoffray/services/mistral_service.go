package services

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
)

// MistralMessage represents a message in the Mistral API format
type MistralMessage struct {
	Role       string `json:"role"`
	Content    string `json:"content,omitempty"`
	Name       string `json:"name,omitempty"`         // For tool messages
	ToolCallID string `json:"tool_call_id,omitempty"` // For tool messages
}

// MistralFunctionCall represents a function call in Mistral's response
// (matches OpenAI/Mistral function calling format)
type MistralFunctionCall struct {
	Name      string                 `json:"name"`
	Arguments map[string]interface{} `json:"arguments"`
}

// MistralChatRequest represents the request structure for Mistral agents API
// Supports function calling (tools field)
type MistralChatRequest struct {
	AgentID          string           `json:"agent_id"`
	Messages         []MistralMessage `json:"messages"`
	MaxTokens        int              `json:"max_tokens,omitempty"`
	Stream           bool             `json:"stream"`
	Stop             []string         `json:"stop,omitempty"`
	PresencePenalty  float64          `json:"presence_penalty,omitempty"`
	FrequencyPenalty float64          `json:"frequency_penalty,omitempty"`
	Tools            []interface{}    `json:"tools,omitempty"`
}

// MistralFunctionCallResponse models a function call in the response
// This is a simplified structure for demonstration
// The actual structure may depend on Mistral's API, adjust as needed
type MistralFunctionCallResponse struct {
	Name      string `json:"name"`
	Arguments string `json:"arguments"` // JSON string
}

// MistralChatChoice is used to parse choices in Mistral's response
// Only relevant fields for function calling are included
type MistralChatChoice struct {
	Message struct {
		Content      string                       `json:"content"`
		FunctionCall *MistralFunctionCallResponse `json:"function_call,omitempty"`
	} `json:"message"`
}

// MistralChatFunctionResponse is used to parse the full response
// Only relevant fields for function calling are included
type MistralChatFunctionResponse struct {
	Choices []MistralChatChoice `json:"choices"`
}

// MistralService handles interactions with the Mistral AI API
type MistralService struct {
	apiKey  string
	apiURL  string
	agentID string
}

// NewMistralService creates a new instance of MistralService
func NewMistralService() *MistralService {
	return &MistralService{
		apiKey:  os.Getenv("MISTRAL_API_KEY"),
		apiURL:  os.Getenv("MISTRAL_API_URL"),
		agentID: os.Getenv("MISTRAL_AGENT_ID"),
	}
}

// SendChatWithTools sends a chat request to Mistral API with tool calling enabled
// Returns the raw response body for further function call handling
func (s *MistralService) SendChatWithTools(messages []MistralMessage, tools []interface{}) ([]byte, error) {
	reqBody := MistralChatRequest{
		AgentID:   s.agentID,
		Messages:  messages,
		MaxTokens: 2000,
		Stream:    false,
		Tools:     tools,
	}
	jsonData, err := json.Marshal(reqBody)
	if err != nil {
		return nil, fmt.Errorf("error marshaling request: %v", err)
	}
	// Create HTTP request
	req, err := http.NewRequest("POST", s.apiURL+"v1/agents/completions", bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, fmt.Errorf("error creating request: %v", err)
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+s.apiKey)
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("error sending request: %v", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		bodyBytes, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("API returned error: %d %s", resp.StatusCode, string(bodyBytes))
	}
	bodyBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("error reading response: %v", err)
	}
	return bodyBytes, nil
}

// ExtractToolCalls extracts the raw tool calls from Mistral's response
func ExtractToolCalls(responseData []byte) ([]map[string]interface{}, bool) {
	var resp struct {
		Choices []struct {
			Message struct {
				ToolCalls json.RawMessage `json:"tool_calls"`
			} `json:"message"`
		} `json:"choices"`
	}

	if err := json.Unmarshal(responseData, &resp); err != nil {
		return nil, false
	}

	if len(resp.Choices) == 0 || len(resp.Choices[0].Message.ToolCalls) == 0 {
		return nil, false
	}

	var toolCalls []map[string]interface{}
	if err := json.Unmarshal(resp.Choices[0].Message.ToolCalls, &toolCalls); err != nil {
		return nil, false
	}

	return toolCalls, true
}

// DetectFunctionCall checks if the response contains a tool call (Mistral function call) and returns its name, arguments and ID
func DetectFunctionCall(responseData []byte) (name string, arguments map[string]interface{}, toolCallID string, found bool, err error) {
	type ToolCall struct {
		ID       string `json:"id"`
		Function struct {
			Name      string `json:"name"`
			Arguments string `json:"arguments"`
		} `json:"function"`
		Index int `json:"index"`
	}
	type AssistantMessage struct {
		Role      string     `json:"role"`
		Content   string     `json:"content"`
		ToolCalls []ToolCall `json:"tool_calls"`
	}
	type ChatChoice struct {
		Index   int              `json:"index"`
		Message AssistantMessage `json:"message"`
	}
	type ChatCompletionResponse struct {
		Choices []ChatChoice `json:"choices"`
	}

	var resp ChatCompletionResponse
	if err := json.Unmarshal(responseData, &resp); err != nil {
		return "", nil, "", false, fmt.Errorf("error unmarshaling response: %v", err)
	}
	for _, choice := range resp.Choices {
		if len(choice.Message.ToolCalls) > 0 {
			tc := choice.Message.ToolCalls[0]
			args := make(map[string]interface{})
			if err := json.Unmarshal([]byte(tc.Function.Arguments), &args); err != nil {
				return tc.Function.Name, nil, tc.ID, true, fmt.Errorf("error parsing tool call arguments: %v", err)
			}
			return tc.Function.Name, args, tc.ID, true, nil
		}
	}
	return "", nil, "", false, nil
}

// SendChatRaw sends a chat request with raw message format (for function calling)
func (s *MistralService) SendChatRaw(messages []map[string]interface{}) (string, error) {
	// Create request body with raw message format
	reqBody := map[string]interface{}{
		"agent_id": s.agentID,
		"messages": messages,
		"stream":   false,
	}

	// Marshal request to JSON
	jsonData, err := json.Marshal(reqBody)
	if err != nil {
		return "", fmt.Errorf("error marshaling request: %v", err)
	}

	// Create HTTP request
	req, err := http.NewRequest("POST", s.apiURL+"v1/agents/completions", bytes.NewBuffer(jsonData))
	if err != nil {
		return "", fmt.Errorf("error creating request: %v", err)
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+s.apiKey)

	// Send request
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return "", fmt.Errorf("error sending request: %v", err)
	}
	defer resp.Body.Close()

	// Check for errors
	if resp.StatusCode != http.StatusOK {
		bodyBytes, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("API returned error: %d %s", resp.StatusCode, string(bodyBytes))
	}

	// Read response body
	bodyBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("error reading response: %v", err)
	}

	// Parse response
	var response struct {
		Choices []struct {
			Message struct {
				Content string `json:"content"`
			} `json:"message"`
		} `json:"choices"`
	}

	if err := json.Unmarshal(bodyBytes, &response); err != nil {
		return "", fmt.Errorf("error unmarshaling response: %v", err)
	}

	if len(response.Choices) == 0 {
		return "", fmt.Errorf("no response from API")
	}

	return response.Choices[0].Message.Content, nil
}

// SendChat is the original non-function-calling chat method
func (s *MistralService) SendChat(messages []MistralMessage) (string, error) {
	// Create request body
	reqBody := MistralChatRequest{
		AgentID:   s.agentID,
		Messages:  messages,
		MaxTokens: 2000,
		Stream:    false,
	}

	// Marshal request to JSON
	jsonData, err := json.Marshal(reqBody)
	if err != nil {
		return "", fmt.Errorf("error marshaling request: %v", err)
	}

	// Create HTTP request
	req, err := http.NewRequest("POST", s.apiURL+"v1/agents/completions", bytes.NewBuffer(jsonData))
	if err != nil {
		return "", fmt.Errorf("error creating request: %v", err)
	}

	// Set headers
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+s.apiKey)

	// Send request
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return "", fmt.Errorf("error sending request: %v", err)
	}
	defer resp.Body.Close()

	// Check response status
	if resp.StatusCode != http.StatusOK {
		bodyBytes, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("API returned error: %d %s", resp.StatusCode, string(bodyBytes))
	}

	// Read response body
	bodyBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("error reading response: %v", err)
	}

	// Parse response
	var response struct {
		Choices []struct {
			Message struct {
				Content string `json:"content"`
			} `json:"message"`
		} `json:"choices"`
	}

	if err := json.Unmarshal(bodyBytes, &response); err != nil {
		return "", fmt.Errorf("error unmarshaling response: %v", err)
	}

	if len(response.Choices) == 0 {
		return "", fmt.Errorf("no response from API")
	}

	return response.Choices[0].Message.Content, nil
}
