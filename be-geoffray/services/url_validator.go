package services

import (
	"fmt"
	"net/http"
	"net/url"
	"strings"
	"time"
)

// URLValidator provides URL validation functionality
type URLValidator struct {
	client *http.Client
}

// NewURLValidator creates a new URL validator
func NewURLValidator() *URLValidator {
	return &URLValidator{
		client: &http.Client{
			Timeout: 10 * time.Second,
			CheckRedirect: func(req *http.Request, via []*http.Request) error {
				// Allow up to 5 redirects
				if len(via) >= 5 {
					return fmt.Errorf("too many redirects")
				}
				return nil
			},
		},
	}
}

// ValidateURL checks if a URL is valid and accessible
func (v *URLValidator) ValidateURL(rawURL string) (bool, error) {
	// Check if URL is empty
	if rawURL == "" {
		return true, nil // Empty URLs are valid (optional field)
	}

	// Parse the URL
	parsedURL, err := url.Parse(rawURL)
	if err != nil {
		return false, fmt.Errorf("invalid URL format: %w", err)
	}

	// Check if scheme is http or https
	if parsedURL.Scheme != "http" && parsedURL.Scheme != "https" {
		return false, fmt.Errorf("URL must use http or https scheme")
	}

	// Check if host is present
	if parsedURL.Host == "" {
		return false, fmt.Errorf("URL must have a valid host")
	}

	// List of known fake/example domains to reject
	fakeDomains := []string{
		"example.com",
		"example.org",
		"example.net",
		"test.com",
		"fake.com",
		"dummy.com",
		"gourmetcheese.com",
		"winekit.com",
		"gourmetsalt.com",
		"oliveoilset.com",
		"chocolatier.com",
		"gourmetspices.com",
	}

	for _, fakeDomain := range fakeDomains {
		if strings.Contains(parsedURL.Host, fakeDomain) {
			return false, fmt.Errorf("example/fake domains are not allowed")
		}
	}

	// For Amazon URLs, check for fake product IDs
	if strings.Contains(parsedURL.Host, "amazon.") {
		// Check for common fake product ID patterns that AI generates
		fakeProductIDs := []string{
			"B07X9Y2ZYX", // Original fake ID
			"B07XZ46W4F", // Another common fake pattern
			"B07XZXK84W", // Another fake pattern
			"B07KK5XKZX", // Another fake pattern
		}

		for _, fakeID := range fakeProductIDs {
			if strings.Contains(rawURL, fakeID) {
				return false, fmt.Errorf("fake Amazon product ID detected: %s", fakeID)
			}
		}

		// Check for suspicious patterns (B07X, B07Z followed by random chars)
		if strings.Contains(rawURL, "/dp/B07X") || strings.Contains(rawURL, "/dp/B07Z") {
			return false, fmt.Errorf("suspicious Amazon product ID pattern detected")
		}
	}

	// Perform a HEAD request to check if URL is accessible
	// This is optional and can be disabled for performance
	if false { // Disabled by default for performance
		req, err := http.NewRequest("HEAD", rawURL, nil)
		if err != nil {
			return false, fmt.Errorf("failed to create request: %w", err)
		}

		// Set a user agent to avoid being blocked
		req.Header.Set("User-Agent", "Mozilla/5.0 (compatible; GiftSuggestionBot/1.0)")

		resp, err := v.client.Do(req)
		if err != nil {
			return false, fmt.Errorf("failed to reach URL: %w", err)
		}
		defer resp.Body.Close()

		// Check if status code indicates success
		if resp.StatusCode >= 400 {
			return false, fmt.Errorf("URL returned error status: %d", resp.StatusCode)
		}
	}

	return true, nil
}

// SanitizeURL cleans and normalizes a URL
func (v *URLValidator) SanitizeURL(rawURL string) string {
	// Trim whitespace
	rawURL = strings.TrimSpace(rawURL)

	// If empty, return as is
	if rawURL == "" {
		return ""
	}

	// Add scheme if missing
	if !strings.HasPrefix(rawURL, "http://") && !strings.HasPrefix(rawURL, "https://") {
		rawURL = "https://" + rawURL
	}

	// Parse and rebuild to normalize
	parsedURL, err := url.Parse(rawURL)
	if err != nil {
		return rawURL // Return original if parsing fails
	}

	return parsedURL.String()
}
