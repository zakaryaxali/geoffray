package localization

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strings"

	"be-geoffray/db"
	"be-geoffray/models"
)

const (
	DefaultLanguage = "en"
)

// Service handles all localization operations
type Service struct {
	db *sql.DB
}

// NewService creates a new localization service
func NewService() *Service {
	return &Service{
		db: db.DB,
	}
}

// GetTranslations retrieves all translations for a specific language
func (s *Service) GetTranslations(languageCode string) (*models.LanguageTranslations, error) {
	// If language code is empty, use default
	if languageCode == "" {
		languageCode = DefaultLanguage
	}

	// First try to load from JSON file directly for better performance
	translations, err := s.loadTranslationsFromFile(languageCode)
	if err == nil && len(translations) > 0 {
		return &models.LanguageTranslations{
			LanguageCode: languageCode,
			Translations: translations,
		}, nil
	}

	// If file loading fails, try from database
	// Query the database for translations
	rows, err := s.db.Query("SELECT key, value FROM translations WHERE language_code = $1", languageCode)
	if err != nil {
		return nil, fmt.Errorf("error querying translations: %w", err)
	}
	defer rows.Close()

	// Create a map to store translations
	translations = make(models.TranslationMap)

	// Iterate through rows and populate the map
	for rows.Next() {
		var key, value string
		if err := rows.Scan(&key, &value); err != nil {
			return nil, fmt.Errorf("error scanning translation row: %w", err)
		}
		translations[key] = value
	}

	// Check for errors from iterating over rows
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating translation rows: %w", err)
	}

	// If no translations found for the requested language, fall back to default
	if len(translations) == 0 && languageCode != DefaultLanguage {
		return s.GetTranslations(DefaultLanguage)
	}

	return &models.LanguageTranslations{
		LanguageCode: languageCode,
		Translations: translations,
	}, nil
}

// SaveTranslation saves a single translation to the database
func (s *Service) SaveTranslation(translation *models.Translation) error {
	// Check if translation already exists
	var exists bool
	err := s.db.QueryRow("SELECT EXISTS(SELECT 1 FROM translations WHERE language_code = $1 AND key = $2)",
		translation.LanguageCode, translation.Key).Scan(&exists)
	if err != nil {
		return fmt.Errorf("error checking if translation exists: %w", err)
	}

	// If translation exists, update it
	if exists {
		_, err = s.db.Exec("UPDATE translations SET value = $1, updated_at = CURRENT_TIMESTAMP WHERE language_code = $2 AND key = $3",
			translation.Value, translation.LanguageCode, translation.Key)
		if err != nil {
			return fmt.Errorf("error updating translation: %w", err)
		}
	} else {
		// If translation doesn't exist, insert it
		_, err = s.db.Exec("INSERT INTO translations (language_code, key, value) VALUES ($1, $2, $3)",
			translation.LanguageCode, translation.Key, translation.Value)
		if err != nil {
			return fmt.Errorf("error inserting translation: %w", err)
		}
	}

	return nil
}

// loadTranslationsFromFile loads translations directly from a JSON file
func (s *Service) loadTranslationsFromFile(languageCode string) (models.TranslationMap, error) {
	filePath := filepath.Join("./localization/translations", languageCode+".json")
	data, err := os.ReadFile(filePath)
	if err != nil {
		return nil, fmt.Errorf("error reading translation file: %w", err)
	}

	// Parse the already flattened JSON structure
	translations := make(models.TranslationMap)
	if err := json.Unmarshal(data, &translations); err != nil {
		return nil, fmt.Errorf("error parsing translation file: %w", err)
	}

	return translations, nil
}

// ImportTranslationsFromJSON imports translations from JSON files
func (s *Service) ImportTranslationsFromJSON(dirPath string) error {
	// Get all JSON files in the directory
	files, err := os.ReadDir(dirPath)
	if err != nil {
		return fmt.Errorf("error reading translation directory: %w", err)
	}

	for _, file := range files {
		// Skip directories and non-JSON files
		if file.IsDir() || !strings.HasSuffix(file.Name(), ".json") {
			continue
		}

		// Extract language code from filename (e.g., "en.json" -> "en")
		languageCode := strings.TrimSuffix(file.Name(), ".json")
		if languageCode == "" {
			continue
		}

		// Read file content
		filePath := filepath.Join(dirPath, file.Name())
		data, err := os.ReadFile(filePath)
		if err != nil {
			log.Printf("Error reading translation file %s: %v", filePath, err)
			continue
		}

		// Parse the already flattened JSON structure
		translations := make(models.TranslationMap)
		if err := json.Unmarshal(data, &translations); err != nil {
			log.Printf("Error parsing translation file %s: %v", filePath, err)
			continue
		}

		// Save translations to database
		for key, value := range translations {
			translation := &models.Translation{
				LanguageCode: languageCode,
				Key:          key,
				Value:        value,
			}
			if err := s.SaveTranslation(translation); err != nil {
				log.Printf("Error saving translation %s.%s: %v", languageCode, key, err)
			}
		}

		log.Printf("Imported translations from %s", filePath)
	}

	return nil
}

// DetectLanguage detects the preferred language from the Accept-Language header
func DetectLanguage(acceptLanguage string) string {
	if acceptLanguage == "" {
		return DefaultLanguage
	}

	// Parse the Accept-Language header
	// Format example: "fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7"
	parts := strings.Split(acceptLanguage, ",")
	if len(parts) == 0 {
		return DefaultLanguage
	}

	// Get the first language preference
	firstLang := strings.TrimSpace(parts[0])
	if firstLang == "" {
		return DefaultLanguage
	}

	// Extract the language code (e.g., "fr-FR" -> "fr")
	langCode := strings.Split(firstLang, "-")[0]
	if langCode == "" {
		return DefaultLanguage
	}

	return strings.ToLower(langCode)
}
