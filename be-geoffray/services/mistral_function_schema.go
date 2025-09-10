package services

// FunctionCallSchema describes a function that the AI can call
// This schema is sent to Mistral as part of the chat context
var FlightInspirationToolSchema = map[string]interface{}{
	"type": "function",
	"function": map[string]interface{}{
		"name":        "search_flights",
		"description": "provides a list of destinations from a city, filter by the maximum price.This tool should be used when a user asked for possible destination from a city. The city must have a valid an airport with a valid IATA Code. The tool will return a list of destinations as IATA codes, from the origin airport, with price and departure date. This tool must not be used to search flights between an origin and a destination",
		"parameters": map[string]interface{}{
			"type": "object",
			"properties": map[string]interface{}{
				"origin": map[string]interface{}{
					"type":        "string",
					"description": "IATA code of the origin airport (e.g., PAR for PARIS, CDG for PARIS CDG, LHR for LONDON HENRY FIELD, HND for TOKYO HANEDA)",
				},
				"departureDate": map[string]interface{}{
					"type":        "string",
					"description": "Departure date in YYYY-MM-DD format. If not provided, the API will search for flights in the next few months.",
				},
				"maxPrice": map[string]interface{}{
					"type":        "integer",
					"description": "Optional maximum price for flights.",
				},
				"oneWay": map[string]interface{}{
					"type":        "boolean",
					"description": "Optional parameter to specify if the flight is one-way. Default is false (round-trip).",
				},
				"nonStop": map[string]interface{}{
					"type":        "boolean",
					"description": "Optional parameter to specify if the flight should be non-stop. Default is true.",
				},
			},
			"required": []string{"origin"},
		},
	},
}

// FlightCheapestDatesToolSchema defines the schema for the Flight Cheapest Date Search API
var FlightCheapestDatesToolSchema = map[string]interface{}{
	"type": "function",
	"function": map[string]interface{}{
		"name":        "search_flight_dates",
		"description": "Finds the cheapest flight dates between a specific origin and destination. This tool should be used when a user wants to know the cheapest dates to fly between two specific cities. Both cities must have valid airports with valid IATA codes. Do not fill the dates if not specified",
		"parameters": map[string]interface{}{
			"type": "object",
			"properties": map[string]interface{}{
				"origin": map[string]interface{}{
					"type":        "string",
					"description": "IATA code of the origin airport (e.g., PAR for PARIS, CDG for PARIS CDG, LHR for LONDON HENRY FIELD, HND for TOKYO HANEDA)",
				},
				"destination": map[string]interface{}{
					"type":        "string",
					"description": "IATA code of the destination airport",
				},
				"departureDate": map[string]interface{}{
					"type":        "string",
					"description": "Optional departure date in YYYY-MM-DD format for the earliest date, or specific date in YYYY-MM-DD format. If not provided, the API will search for flights in the next few months. Ranges must be specified with a comma.",
				},
				"duration": map[string]interface{}{
					"type":        "integer",
					"description": "Optional duration of the trip in days. Only applicable for round-trip flights. For one-way flights, leave this empty.",
				},
				"maxPrice": map[string]interface{}{
					"type":        "integer",
					"description": "Optional maximum price for flights.",
				},
				"oneWay": map[string]interface{}{
					"type":        "boolean",
					"description": "Optional parameter to specify if the flight is one-way. Default is false (round-trip).",
				},
				"nonStop": map[string]interface{}{
					"type":        "boolean",
					"description": "Optional parameter to specify if the flight should be non-stop. Default is true.",
				},
			},
			"required": []string{"origin", "destination"},
		},
	},
}
