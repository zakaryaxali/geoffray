package config

import (
	"log"
	"os"
	"sync"
)

// AppConfig holds all application configuration
type AppConfig struct {
	FrontendURL string
	DBHost      string
	DBPort      string
	DBUser      string
	DBPassword  string
	DBName      string
	JWTSecret   string
	// Add other config values as needed
}

var (
	once     sync.Once
	instance *AppConfig
)

// GetConfig returns the singleton config instance
func GetConfig() *AppConfig {
	once.Do(func() {
		// Make sure environment variables are loaded
		LoadEnv()

		instance = &AppConfig{
			FrontendURL: getEnvWithDefault("FRONTEND_URL", "https://localhost:8081"),
			DBHost:      getEnvWithDefault("DB_HOST", "localhost"),
			DBPort:      getEnvWithDefault("DB_PORT", "5432"),
			DBUser:      getEnvWithDefault("DB_USER", "postgres"),
			DBPassword:  getEnvWithDefault("DB_PASSWORD", ""),
			DBName:      getEnvWithDefault("DB_NAME", "geoffray_db"),
			JWTSecret:   getEnvWithDefault("JWT_SECRET", "your_secure_jwt_secret_for_geoffray_app"),
			// Initialize other config values here
		}
		log.Println("Configuration loaded successfully")
	})
	return instance
}

// getEnvWithDefault returns the value of the environment variable or a default value if not set
func getEnvWithDefault(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
}
