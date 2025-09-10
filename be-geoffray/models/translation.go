package models

// Translation represents a localized string in the database
type Translation struct {
	ID           string `json:"id"`
	LanguageCode string `json:"language_code"` // e.g., "en", "fr"
	Key          string `json:"key"`           // e.g., "welcome_message"
	Value        string `json:"value"`         // The translated string
}

// TranslationMap is a map of translation keys to their values
type TranslationMap map[string]string

// LanguageTranslations represents all translations for a specific language
type LanguageTranslations struct {
	LanguageCode string         `json:"language_code"`
	Translations TranslationMap `json:"translations"`
}
