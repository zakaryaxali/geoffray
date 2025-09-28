package db

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	"regexp"
	"strings"
	"time"

	"be-geoffray/config"
	_ "github.com/lib/pq"
)

var DB *sql.DB

// InitDB initializes the database connection using the application config
func InitDB() {
	var err error

	// Determine SSL mode based on environment
	env := os.Getenv("ENV")
	var sslMode string
	switch env {
	case "production":
		sslMode = "require" // Enforce SSL in production
	case "staging":
		sslMode = "disable" // Staging uses internal Docker network, no SSL needed
	default:
		sslMode = "disable" // Development/local environments
	}
	log.Printf("Environment: %s, Using SSL mode: %s\n", env, sslMode)

	// Check if DATABASE_URL environment variable is set
	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL != "" {
		// Use the full connection string if available
		log.Println("Using DATABASE_URL environment variable for database connection")

		// Ensure DATABASE_URL uses our determined SSL mode
		if strings.Contains(databaseURL, "sslmode=") {
			// Replace existing sslmode with our determined one
			re := regexp.MustCompile(`sslmode=\w+`)
			databaseURL = re.ReplaceAllString(databaseURL, fmt.Sprintf("sslmode=%s", sslMode))
		} else {
			// Add sslmode parameter
			if strings.Contains(databaseURL, "?") {
				databaseURL += fmt.Sprintf("&sslmode=%s", sslMode)
			} else {
				databaseURL += fmt.Sprintf("?sslmode=%s", sslMode)
			}
		}

		DB, err = sql.Open("postgres", databaseURL)
		if err != nil {
			log.Printf("Error opening database connection with DATABASE_URL: %v\n", err)
			panic(err)
		}
	} else {
		// Construct the connection string with configurable SSL mode
		log.Println("Constructing database connection string from individual parameters")

		// Get configuration from AppConfig
		appConfig := config.GetConfig()
		dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s sslmode=%s",
			appConfig.DBHost,
			appConfig.DBUser,
			appConfig.DBPassword,
			appConfig.DBName,
			appConfig.DBPort,
			sslMode,
		)
		DB, err = sql.Open("postgres", dsn)
		if err != nil {
			log.Printf("Error opening database connection with parameters: %v\n", err)
			panic(err)
		}
	}

	// Configure connection pool settings
	DB.SetMaxOpenConns(25)
	DB.SetMaxIdleConns(5)
	DB.SetConnMaxLifetime(5 * time.Minute)

	// Test the connection
	log.Println("Testing database connection...")
	err = DB.Ping()
	if err != nil {
		log.Printf("Error pinging database: %v\n", err)
		panic(err)
	}

	log.Println("Successfully connected to the database!")
}

// SetupDatabase runs database migrations to ensure schema is up to date
func SetupDatabase(db *sql.DB) {
	log.Println("Setting up database schema...")

	// Run all pending migrations
	if err := RunMigrations(db); err != nil {
		log.Printf("Error running migrations: %v\n", err)
		// For backwards compatibility, if migrations fail, we can fall back to checking
		// if basic tables exist and warn the user
		log.Println("Migration failed - please check your database permissions and migration files")
		panic(err)
	}

	log.Println("Database setup completed successfully")
}
