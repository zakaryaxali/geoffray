package services

import (
	"bytes"
	"encoding/json"
	"errors"
	"io"
	"log"
	"net/http"
	"os"
	"strconv"
	"sync"
	"time"
)

// Amadeus API constants
const (
	AmadeusBaseURL                    = "https://test.api.amadeus.com"
	AmadeusAuthEndpoint               = "/v1/security/oauth2/token"
	AmadeusFlightDestinationsEndpoint = "/v1/shopping/flight-destinations"
	AmadeusFlightDatesEndpoint        = "/v1/shopping/flight-dates"
)

type amadeusToken struct {
	AccessToken string    `json:"access_token"`
	ExpiresIn   int       `json:"expires_in"`
	Type        string    `json:"token_type"`
	Scope       string    `json:"scope"`
	ObtainedAt  time.Time // not from API, for caching
}

var (
	amadeusTokenCache amadeusToken
	tokenMutex        sync.Mutex
)

func getAmadeusToken() (string, error) {
	tokenMutex.Lock()
	defer tokenMutex.Unlock()

	// Check if cached token is still valid
	if amadeusTokenCache.AccessToken != "" && time.Since(amadeusTokenCache.ObtainedAt) < time.Duration(amadeusTokenCache.ExpiresIn-60)*time.Second {
		return amadeusTokenCache.AccessToken, nil
	}

	clientID := os.Getenv("AMADEUS_CLIENT_ID")
	clientSecret := os.Getenv("AMADEUS_CLIENT_SECRET")
	if clientID == "" || clientSecret == "" {
		return "", errors.New("missing Amadeus credentials in environment")
	}

	data := "grant_type=client_credentials&client_id=" + clientID + "&client_secret=" + clientSecret
	resp, err := http.Post(
		AmadeusBaseURL+AmadeusAuthEndpoint,
		"application/x-www-form-urlencoded",
		bytes.NewBufferString(data),
	)
	if err != nil {
		log.Printf("failed to request Amadeus token: %v", err)
		return "", err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return "", errors.New("failed to get Amadeus token: " + string(body))
	}
	var tokenResp struct {
		AccessToken string `json:"access_token"`
		ExpiresIn   int    `json:"expires_in"`
		Type        string `json:"token_type"`
		Scope       string `json:"scope"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&tokenResp); err != nil {
		return "", err
	}
	amadeusTokenCache = amadeusToken{
		AccessToken: tokenResp.AccessToken,
		ExpiresIn:   tokenResp.ExpiresIn,
		Type:        tokenResp.Type,
		Scope:       tokenResp.Scope,
		ObtainedAt:  time.Now(),
	}
	return amadeusTokenCache.AccessToken, nil
}

type FlightOption struct {
	Origin        string `json:"origin"`
	Destination   string `json:"destination"`
	DepartureDate string `json:"departureDate"`
	ReturnDate    string `json:"returnDate,omitempty"`
	Price         string `json:"price"`
	Currency      string `json:"currency"`
}

type flightSearchResponse struct {
	Data []struct {
		Origin        string `json:"origin"`
		Destination   string `json:"destination"`
		DepartureDate string `json:"departureDate"`
		ReturnDate    string `json:"returnDate,omitempty"`
		Price         struct {
			Total    string `json:"total"`
			Currency string `json:"currency"`
		} `json:"price"`
	} `json:"data"`
}

func GetFlightInspiration(origin string, departureDate string, maxPrice *int, oneWay *bool, nonStop *bool) ([]FlightOption, error) {
	if origin == "" {
		return nil, errors.New("origin parameter is required")
	}
	token, err := getAmadeusToken()
	if err != nil {
		return nil, err
	}

	url := AmadeusBaseURL + AmadeusFlightDestinationsEndpoint + "?origin=" + origin

	// Add departure date if provided
	if departureDate != "" {
		url += "&departureDate=" + departureDate
	}

	// Add max price if provided
	if maxPrice != nil {
		url += "&maxPrice=" + strconv.Itoa(*maxPrice)
	}

	// Add oneWay parameter (default is false if not provided)
	if oneWay != nil {
		url += "&oneWay=" + strconv.FormatBool(*oneWay)
	}

	// Add nonStop parameter (default is true if not provided)
	if nonStop != nil {
		url += "&nonStop=" + strconv.FormatBool(*nonStop)
	} else {
		// Default to true if not specified
		url += "&nonStop=true"
	}
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", "Bearer "+token)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, errors.New("Amadeus API error: " + string(body))
	}
	var apiResp flightSearchResponse
	if err := json.NewDecoder(resp.Body).Decode(&apiResp); err != nil {
		return nil, err
	}
	options := make([]FlightOption, 0, len(apiResp.Data))
	for _, d := range apiResp.Data {
		options = append(options, FlightOption{
			Origin:        d.Origin,
			Destination:   d.Destination,
			DepartureDate: d.DepartureDate,
			ReturnDate:    d.ReturnDate,
			Price:         d.Price.Total,
			Currency:      d.Price.Currency,
		})
	}
	return options, nil
}

// FlightDateOption represents a flight date option returned by the Flight Cheapest Date Search API
type FlightDateOption struct {
	Origin        string `json:"origin"`
	Destination   string `json:"destination"`
	DepartureDate string `json:"departureDate"`
	ReturnDate    string `json:"returnDate,omitempty"`
	Price         string `json:"price"`
	Currency      string `json:"currency"`
}

// flightDatesResponse represents the response from the Flight Cheapest Date Search API
type flightDatesResponse struct {
	Data []struct {
		Type          string `json:"type"`
		Origin        string `json:"origin"`
		Destination   string `json:"destination"`
		DepartureDate string `json:"departureDate"`
		ReturnDate    string `json:"returnDate,omitempty"`
		Price         struct {
			Total    string `json:"total"`
			Currency string `json:"currency"`
		} `json:"price"`
		Links struct {
			FlightDates  string `json:"flightDates,omitempty"`
			FlightOffers string `json:"flightOffers,omitempty"`
		} `json:"links,omitempty"`
	} `json:"data"`
}

// GetFlightCheapestDates retrieves the cheapest flight dates between origin and destination
func GetFlightCheapestDates(origin, destination string, departureDate string, duration *int, maxPrice *int, oneWay *bool, nonStop *bool) ([]FlightDateOption, error) {
	if origin == "" || destination == "" {
		return nil, errors.New("origin and destination parameters are required")
	}

	token, err := getAmadeusToken()
	if err != nil {
		return nil, err
	}

	url := AmadeusBaseURL + AmadeusFlightDatesEndpoint + "?origin=" + origin + "&destination=" + destination

	// Add departure date if provided
	if departureDate != "" {
		url += "&departureDate=" + departureDate
	}

	// Add duration if provided
	if duration != nil {
		url += "&duration=" + strconv.Itoa(*duration)
	}

	// Add max price if provided
	if maxPrice != nil {
		url += "&maxPrice=" + strconv.Itoa(*maxPrice)
	}

	// Add oneWay parameter (default is false if not provided)
	if oneWay != nil {
		url += "&oneWay=" + strconv.FormatBool(*oneWay)
	}

	// Add nonStop parameter (default is true if not provided)
	if nonStop != nil {
		url += "&nonStop=" + strconv.FormatBool(*nonStop)
	} else {
		// Default to true if not specified
		url += "&nonStop=true"
	}

	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", "Bearer "+token)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, errors.New("Amadeus API error: " + string(body))
	}

	var apiResp flightDatesResponse
	if err := json.NewDecoder(resp.Body).Decode(&apiResp); err != nil {
		return nil, err
	}

	options := make([]FlightDateOption, 0, len(apiResp.Data))
	for _, d := range apiResp.Data {
		options = append(options, FlightDateOption{
			Origin:        d.Origin,
			Destination:   d.Destination,
			DepartureDate: d.DepartureDate,
			ReturnDate:    d.ReturnDate,
			Price:         d.Price.Total,
			Currency:      d.Price.Currency,
		})
	}

	return options, nil
}
