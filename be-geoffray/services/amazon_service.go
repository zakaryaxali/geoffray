package services

import (
	"bytes"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"sort"
	"strings"
	"sync"
	"time"
)

// AmazonRegionConfig holds configuration for a specific Amazon marketplace
type AmazonRegionConfig struct {
	PartnerTag  string // Affiliate tag (e.g., "yoursite-20")
	Host        string // PA-API host (e.g., "webservices.amazon.com")
	Region      string // AWS region for signing (e.g., "us-east-1")
	Marketplace string // Marketplace domain (e.g., "www.amazon.com")
}

// AmazonProduct represents a product from the PA-API
type AmazonProduct struct {
	ASIN         string  `json:"asin"`
	Title        string  `json:"title"`
	Price        string  `json:"price"`
	CurrencyCode string  `json:"currency_code"`
	AffiliateURL string  `json:"affiliate_url"`
	ImageURL     string  `json:"image_url,omitempty"`
	Rating       float64 `json:"rating,omitempty"`
	ReviewCount  int     `json:"review_count,omitempty"`
}

// cacheEntry holds cached product search results
type cacheEntry struct {
	products  []AmazonProduct
	timestamp time.Time
}

// AmazonService handles Amazon Product Advertising API interactions
type AmazonService struct {
	accessKey   string
	secretKey   string
	configs     map[string]*AmazonRegionConfig
	httpClient  *http.Client
	cache       *sync.Map
	cacheExpiry time.Duration
	enabled     bool
}

// NewAmazonService creates a new instance of AmazonService
func NewAmazonService() *AmazonService {
	accessKey := os.Getenv("AMAZON_ACCESS_KEY")
	secretKey := os.Getenv("AMAZON_SECRET_KEY")
	enabled := os.Getenv("AMAZON_API_ENABLED") == "true"

	// Build region configs
	configs := make(map[string]*AmazonRegionConfig)

	// US region
	usTag := os.Getenv("AMAZON_PARTNER_TAG_US")
	if usTag != "" {
		configs["us"] = &AmazonRegionConfig{
			PartnerTag:  usTag,
			Host:        "webservices.amazon.com",
			Region:      "us-east-1",
			Marketplace: "www.amazon.com",
		}
	}

	// France region
	frTag := os.Getenv("AMAZON_PARTNER_TAG_FR")
	if frTag != "" {
		configs["fr"] = &AmazonRegionConfig{
			PartnerTag:  frTag,
			Host:        "webservices.amazon.fr",
			Region:      "eu-west-1",
			Marketplace: "www.amazon.fr",
		}
	}

	return &AmazonService{
		accessKey:   accessKey,
		secretKey:   secretKey,
		configs:     configs,
		httpClient:  &http.Client{Timeout: 10 * time.Second},
		cache:       &sync.Map{},
		cacheExpiry: 24 * time.Hour,
		enabled:     enabled && accessKey != "" && secretKey != "",
	}
}

// IsEnabled returns whether the Amazon service is properly configured
func (s *AmazonService) IsEnabled() bool {
	return s.enabled && len(s.configs) > 0
}

// getConfig returns the config for a region, defaulting to US
func (s *AmazonService) getConfig(region string) *AmazonRegionConfig {
	if config, ok := s.configs[region]; ok {
		return config
	}
	// Default to US if available
	if config, ok := s.configs["us"]; ok {
		return config
	}
	// Return any available config
	for _, config := range s.configs {
		return config
	}
	return nil
}

// SearchProducts searches Amazon for products matching a query
func (s *AmazonService) SearchProducts(query string, category string, region string) ([]AmazonProduct, error) {
	if !s.enabled {
		return nil, fmt.Errorf("Amazon service not enabled")
	}

	config := s.getConfig(region)
	if config == nil {
		return nil, fmt.Errorf("no Amazon configuration available for region: %s", region)
	}

	// Check cache first
	cacheKey := fmt.Sprintf("%s:%s:%s", region, category, query)
	if entry, ok := s.cache.Load(cacheKey); ok {
		cached := entry.(*cacheEntry)
		if time.Since(cached.timestamp) < s.cacheExpiry {
			return cached.products, nil
		}
	}

	// Build PA-API request
	products, err := s.callPAAPI(query, category, config)
	if err != nil {
		return nil, err
	}

	// Cache the results
	s.cache.Store(cacheKey, &cacheEntry{
		products:  products,
		timestamp: time.Now(),
	})

	return products, nil
}

// GenerateSearchURL creates an Amazon search URL with affiliate tag
func (s *AmazonService) GenerateSearchURL(query string, region string) string {
	config := s.getConfig(region)
	if config == nil {
		// Default to US Amazon
		return fmt.Sprintf("https://www.amazon.com/s?k=%s", url.QueryEscape(query))
	}

	encodedQuery := url.QueryEscape(query)
	return fmt.Sprintf("https://%s/s?k=%s&tag=%s",
		config.Marketplace, encodedQuery, config.PartnerTag)
}

// GenerateProductURL creates an Amazon product URL with affiliate tag
func (s *AmazonService) GenerateProductURL(asin string, region string) string {
	config := s.getConfig(region)
	if config == nil {
		return fmt.Sprintf("https://www.amazon.com/dp/%s", asin)
	}

	return fmt.Sprintf("https://%s/dp/%s?tag=%s",
		config.Marketplace, asin, config.PartnerTag)
}

// EnrichWithAmazonData enriches gift suggestion data with Amazon product info
// Returns the affiliate URL, price, and any error
func (s *AmazonService) EnrichWithAmazonData(name string, category string, region string) (affiliateURL string, price string, asin string, err error) {
	if !s.enabled {
		// Fallback to search URL
		return s.GenerateSearchURL(name, region), "", "", nil
	}

	// Build search query from gift name and category
	query := s.buildSearchQuery(name, category)

	// Try PA-API first
	products, err := s.SearchProducts(query, category, region)
	if err == nil && len(products) > 0 {
		// Use the best match (first result)
		best := products[0]
		return best.AffiliateURL, best.Price, best.ASIN, nil
	}

	// Fallback to search URL
	return s.GenerateSearchURL(query, region), "", "", nil
}

// buildSearchQuery creates a search query from gift name and category
func (s *AmazonService) buildSearchQuery(name string, category string) string {
	// Combine name with category for better results
	// Remove common filler words
	query := name
	if category != "" && !strings.Contains(strings.ToLower(name), strings.ToLower(category)) {
		query = fmt.Sprintf("%s %s", name, category)
	}
	return query
}

// callPAAPI makes the actual PA-API request
func (s *AmazonService) callPAAPI(query string, category string, config *AmazonRegionConfig) ([]AmazonProduct, error) {
	// Build the request payload
	payload := map[string]interface{}{
		"Keywords":    query,
		"Resources":   []string{"ItemInfo.Title", "Offers.Listings.Price", "Images.Primary.Large"},
		"ItemCount":   3,
		"PartnerTag":  config.PartnerTag,
		"PartnerType": "Associates",
		"Marketplace": config.Marketplace,
	}

	// Map category to Amazon search index if possible
	searchIndex := mapCategoryToSearchIndex(category)
	if searchIndex != "" {
		payload["SearchIndex"] = searchIndex
	}

	jsonPayload, err := json.Marshal(payload)
	if err != nil {
		return nil, fmt.Errorf("error marshaling request: %v", err)
	}

	// Create the request
	endpoint := fmt.Sprintf("https://%s/paapi5/searchitems", config.Host)
	req, err := http.NewRequest("POST", endpoint, bytes.NewBuffer(jsonPayload))
	if err != nil {
		return nil, fmt.Errorf("error creating request: %v", err)
	}

	// Set headers
	req.Header.Set("Content-Type", "application/json; charset=UTF-8")
	req.Header.Set("Content-Encoding", "amz-1.0")
	req.Header.Set("X-Amz-Target", "com.amazon.paapi5.v1.ProductAdvertisingAPIv1.SearchItems")

	// Sign the request with AWS Signature Version 4
	if err := s.signRequest(req, jsonPayload, config); err != nil {
		return nil, fmt.Errorf("error signing request: %v", err)
	}

	// Send the request
	resp, err := s.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("error sending request: %v", err)
	}
	defer resp.Body.Close()

	// Read response
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("error reading response: %v", err)
	}

	// Check for errors
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("PA-API error: %d - %s", resp.StatusCode, string(body))
	}

	// Parse response
	return s.parseSearchResponse(body, config)
}

// signRequest signs the request using AWS Signature Version 4
func (s *AmazonService) signRequest(req *http.Request, payload []byte, config *AmazonRegionConfig) error {
	// Current time in UTC
	t := time.Now().UTC()
	amzDate := t.Format("20060102T150405Z")
	dateStamp := t.Format("20060102")

	// Set required headers
	req.Header.Set("Host", config.Host)
	req.Header.Set("X-Amz-Date", amzDate)

	// Create canonical request
	canonicalURI := "/paapi5/searchitems"
	canonicalQueryString := ""

	// Create signed headers
	signedHeaders := "content-encoding;content-type;host;x-amz-date;x-amz-target"

	// Create canonical headers
	canonicalHeaders := fmt.Sprintf("content-encoding:%s\ncontent-type:%s\nhost:%s\nx-amz-date:%s\nx-amz-target:%s\n",
		req.Header.Get("Content-Encoding"),
		req.Header.Get("Content-Type"),
		config.Host,
		amzDate,
		req.Header.Get("X-Amz-Target"))

	// Create payload hash
	payloadHash := sha256Hash(payload)

	// Create canonical request
	canonicalRequest := fmt.Sprintf("%s\n%s\n%s\n%s\n%s\n%s",
		"POST",
		canonicalURI,
		canonicalQueryString,
		canonicalHeaders,
		signedHeaders,
		payloadHash)

	// Create string to sign
	algorithm := "AWS4-HMAC-SHA256"
	credentialScope := fmt.Sprintf("%s/%s/ProductAdvertisingAPI/aws4_request", dateStamp, config.Region)
	stringToSign := fmt.Sprintf("%s\n%s\n%s\n%s",
		algorithm,
		amzDate,
		credentialScope,
		sha256Hash([]byte(canonicalRequest)))

	// Create signing key
	signingKey := getSignatureKey(s.secretKey, dateStamp, config.Region, "ProductAdvertisingAPI")

	// Create signature
	signature := hex.EncodeToString(hmacSHA256(signingKey, []byte(stringToSign)))

	// Create authorization header
	authHeader := fmt.Sprintf("%s Credential=%s/%s, SignedHeaders=%s, Signature=%s",
		algorithm,
		s.accessKey,
		credentialScope,
		signedHeaders,
		signature)

	req.Header.Set("Authorization", authHeader)

	return nil
}

// parseSearchResponse parses the PA-API search response
func (s *AmazonService) parseSearchResponse(body []byte, config *AmazonRegionConfig) ([]AmazonProduct, error) {
	var response struct {
		SearchResult struct {
			Items []struct {
				ASIN     string `json:"ASIN"`
				ItemInfo struct {
					Title struct {
						DisplayValue string `json:"DisplayValue"`
					} `json:"Title"`
				} `json:"ItemInfo"`
				Offers struct {
					Listings []struct {
						Price struct {
							DisplayAmount string `json:"DisplayAmount"`
							Currency      string `json:"Currency"`
						} `json:"Price"`
					} `json:"Listings"`
				} `json:"Offers"`
				Images struct {
					Primary struct {
						Large struct {
							URL string `json:"URL"`
						} `json:"Large"`
					} `json:"Primary"`
				} `json:"Images"`
			} `json:"Items"`
		} `json:"SearchResult"`
	}

	if err := json.Unmarshal(body, &response); err != nil {
		return nil, fmt.Errorf("error parsing response: %v", err)
	}

	var products []AmazonProduct
	for _, item := range response.SearchResult.Items {
		product := AmazonProduct{
			ASIN:         item.ASIN,
			Title:        item.ItemInfo.Title.DisplayValue,
			AffiliateURL: s.GenerateProductURL(item.ASIN, getRegionFromConfig(config)),
		}

		if len(item.Offers.Listings) > 0 {
			product.Price = item.Offers.Listings[0].Price.DisplayAmount
			product.CurrencyCode = item.Offers.Listings[0].Price.Currency
		}

		if item.Images.Primary.Large.URL != "" {
			product.ImageURL = item.Images.Primary.Large.URL
		}

		products = append(products, product)
	}

	return products, nil
}

// Helper functions for AWS Signature

func sha256Hash(data []byte) string {
	hash := sha256.Sum256(data)
	return hex.EncodeToString(hash[:])
}

func hmacSHA256(key []byte, data []byte) []byte {
	h := hmac.New(sha256.New, key)
	h.Write(data)
	return h.Sum(nil)
}

func getSignatureKey(secretKey string, dateStamp string, regionName string, serviceName string) []byte {
	kDate := hmacSHA256([]byte("AWS4"+secretKey), []byte(dateStamp))
	kRegion := hmacSHA256(kDate, []byte(regionName))
	kService := hmacSHA256(kRegion, []byte(serviceName))
	kSigning := hmacSHA256(kService, []byte("aws4_request"))
	return kSigning
}

func getRegionFromConfig(config *AmazonRegionConfig) string {
	switch config.Marketplace {
	case "www.amazon.fr":
		return "fr"
	default:
		return "us"
	}
}

// mapCategoryToSearchIndex maps gift categories to Amazon search indexes
func mapCategoryToSearchIndex(category string) string {
	categoryLower := strings.ToLower(category)
	switch {
	case strings.Contains(categoryLower, "book"):
		return "Books"
	case strings.Contains(categoryLower, "electronic"), strings.Contains(categoryLower, "tech"), strings.Contains(categoryLower, "gadget"):
		return "Electronics"
	case strings.Contains(categoryLower, "kitchen"), strings.Contains(categoryLower, "home"):
		return "HomeAndKitchen"
	case strings.Contains(categoryLower, "toy"), strings.Contains(categoryLower, "game"):
		return "ToysAndGames"
	case strings.Contains(categoryLower, "sport"), strings.Contains(categoryLower, "outdoor"):
		return "SportsAndOutdoors"
	case strings.Contains(categoryLower, "beauty"), strings.Contains(categoryLower, "personal"):
		return "Beauty"
	case strings.Contains(categoryLower, "fashion"), strings.Contains(categoryLower, "cloth"):
		return "Fashion"
	case strings.Contains(categoryLower, "food"), strings.Contains(categoryLower, "gourmet"):
		return "GroceryAndGourmetFood"
	default:
		return "All" // Search all categories
	}
}

// MapLanguageToRegion maps language codes to Amazon regions
func MapLanguageToRegion(language string) string {
	switch strings.ToLower(language) {
	case "fr", "fr-fr", "french":
		return "fr"
	default:
		return "us"
	}
}

// CleanupCache removes expired entries from the cache
func (s *AmazonService) CleanupCache() {
	now := time.Now()
	s.cache.Range(func(key, value interface{}) bool {
		entry := value.(*cacheEntry)
		if now.Sub(entry.timestamp) > s.cacheExpiry {
			s.cache.Delete(key)
		}
		return true
	})
}

// GetPartnerTag returns the affiliate tag for a region
func (s *AmazonService) GetPartnerTag(region string) string {
	config := s.getConfig(region)
	if config != nil {
		return config.PartnerTag
	}
	return ""
}

// Ensure sorted import for canonical headers
var _ = sort.Strings
