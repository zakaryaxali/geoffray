package services

import (
	"fmt"
	"strings"
)

// FormatFlightsForDisplay formats flight results in a structured way for Mistral to understand
func FormatFlightsForDisplay(flights []FlightOption) string {
	if len(flights) == 0 {
		return "Aucun vol trouvé correspondant à vos critères."
	}

	var sb strings.Builder
	sb.WriteString("Voici les destinations disponibles depuis votre ville:\n\n")

	for _, flight := range flights {
		sb.WriteString(fmt.Sprintf("📍 **%s**\n", flight.Destination))
		sb.WriteString(fmt.Sprintf("💰 Prix: %s %s\n", flight.Price, flight.Currency))
		sb.WriteString(fmt.Sprintf("🗓️ Date de départ: %s\n", flight.DepartureDate))
		if flight.ReturnDate != "" {
			sb.WriteString(fmt.Sprintf("🔄 Date de retour: %s\n", flight.ReturnDate))
		}
		sb.WriteString("\n")
	}

	return sb.String()
}

// FormatFlightDatesForDisplay formats flight date results in a structured way for Mistral to understand
func FormatFlightDatesForDisplay(flightDates []FlightDateOption) string {
	if len(flightDates) == 0 {
		return "Aucun vol trouvé correspondant à vos critères."
	}

	var sb strings.Builder
	sb.WriteString("Voici les dates les moins chères pour votre itinéraire:\n\n")

	for _, date := range flightDates {
		if date.ReturnDate != "" {
			sb.WriteString(fmt.Sprintf("🗓️ **%s à %s**\n", date.DepartureDate, date.ReturnDate))
		} else {
			sb.WriteString(fmt.Sprintf("🗓️ **%s**\n", date.DepartureDate))
		}
		sb.WriteString(fmt.Sprintf("💰 Prix: %s %s\n", date.Price, date.Currency))
		sb.WriteString("\n")
	}

	return sb.String()
}
