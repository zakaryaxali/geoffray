package config

import (
	"log"
	"os"
	"path/filepath"

	"github.com/joho/godotenv"
)

// LoadEnv loads environment variables from .env file
func LoadEnv() {
	// Try to find .env file starting from current directory and moving up
	dir, err := os.Getwd()
	if err != nil {
		log.Fatal("Error getting current directory:", err)
	}

	for {
		envFile := filepath.Join(dir, ".env")
		if _, err := os.Stat(envFile); err == nil {
			err := godotenv.Load(envFile)
			if err != nil {
				log.Fatal("Error loading .env file:", err)
			}
			log.Printf("Loaded environment variables from: %s\n", envFile)
			return
		}

		// Move up one directory
		parent := filepath.Dir(dir)
		if parent == dir {
			// We've reached the root directory
			break
		}
		dir = parent
	}

	log.Println("Warning: .env file not found, using environment variables from system")
}
