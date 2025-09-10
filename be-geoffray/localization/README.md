# Localization System

This package implements localization support for the Geoffray application, providing translations in multiple languages (currently English and French).

## Features

- Language detection from Accept-Language header
- Language override via query parameter (`?lang=fr`)
- Fallback to default language (English) when translations are missing
- Flattened JSON translation files with dot notation keys
- Database storage with the same dot notation format
- API endpoints for retrieving translations
- Direct file loading for better performance

## API Endpoints

- `GET /api/translations?lang=fr` - Get all translations for a specific language
- `POST /api/translations/import` - Import translations from JSON files (admin only)

## Translation Files

Translation files are stored in the `translations` directory in JSON format. Each file is named after its language code (e.g., `en.json`, `fr.json`). The files use a flattened structure with dot notation keys for better organization and direct access:

```json
{
  "common.welcome": "Welcome to Geoffray",
  "common.continue": "Continue",
  "auth.login": "Login",
  "auth.signup": "Sign Up"
}
```

This format allows for logical grouping of translations by category (common, auth, etc.) while keeping the structure flat for easier processing. The same structure is used in both the JSON files and the database.

## Adding a New Language

To add a new language:

1. Create a new JSON file in the `translations` directory (e.g., `es.json` for Spanish)
2. Copy the structure from an existing translation file
3. Translate all values to the new language
4. Restart the application or call the import endpoint

## Usage in Frontend

The frontend should:

1. Call the `/api/translations` endpoint on startup
2. Store the translations in memory
3. Use the translations for all UI text

Example:

```javascript
// Fetch translations
const response = await fetch('/api/translations?lang=fr');
const translations = await response.json();

// Use translations with dot notation
function translate(key, defaultValue = '') {
  return translations.translations[key] || defaultValue;
}

// Example usage
const welcomeMessage = translate('common.welcome', 'Welcome');
const loginText = translate('auth.login', 'Login');
```

The translations are returned in a flattened format with dot notation keys, matching the nested structure in the JSON files.
