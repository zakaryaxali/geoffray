package localization

import (
	"testing"
)

func TestDetectLanguage(t *testing.T) {
	tests := []struct {
		name           string
		acceptLanguage string
		expected       string
	}{
		{
			name:           "Empty header",
			acceptLanguage: "",
			expected:       DefaultLanguage,
		},
		{
			name:           "French primary",
			acceptLanguage: "fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7",
			expected:       "fr",
		},
		{
			name:           "English primary",
			acceptLanguage: "en-US,en;q=0.9,fr;q=0.8",
			expected:       "en",
		},
		{
			name:           "Single language",
			acceptLanguage: "fr",
			expected:       "fr",
		},
		{
			name:           "Complex case",
			acceptLanguage: "fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7,es;q=0.6",
			expected:       "fr",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := DetectLanguage(tt.acceptLanguage)
			if result != tt.expected {
				t.Errorf("DetectLanguage(%q) = %q, expected %q", tt.acceptLanguage, result, tt.expected)
			}
		})
	}
}
