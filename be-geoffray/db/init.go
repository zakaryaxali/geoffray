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
		sslMode = "prefer" // Try SSL first, fallback if not available
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

// CheckTablesExist checks if the required tables exist in the database
func CheckTablesExist(db *sql.DB) (map[string]bool, error) {
	// Check all required tables
	requiredTables := []string{"users", "refresh_tokens", "events", "event_participants"}
	tableStatus := make(map[string]bool)

	// Initialize all tables as not existing
	for _, table := range requiredTables {
		tableStatus[table] = false
	}

	// Check each table
	for _, table := range requiredTables {
		var exists bool
		query := fmt.Sprintf(`
		SELECT EXISTS (
			SELECT FROM information_schema.tables 
			WHERE table_schema = 'public' 
			AND table_name = '%s'
		);
		`, table)

		err := db.QueryRow(query).Scan(&exists)
		if err != nil {
			return tableStatus, err
		}

		tableStatus[table] = exists
		log.Printf("Table '%s' exists: %v", table, exists)
	}

	return tableStatus, nil
}

// CheckTablePermissions checks if the user has permissions to create tables
func CheckTablePermissions(db *sql.DB) (bool, error) {
	// Check if the current user has CREATE permission on the public schema
	var canCreate bool
	query := `SELECT has_schema_privilege(current_user, 'public', 'create');`
	err := db.QueryRow(query).Scan(&canCreate)
	return canCreate, err
}

// UpdateExistingTables ensures that existing tables have the latest schema
func UpdateExistingTables(db *sql.DB) {
	log.Println("Checking for schema updates...")

	// Add any schema updates here
	// For example, adding new columns to existing tables
	_, err := db.Exec(`
		DO $$
		BEGIN
			-- Add country_code and phone_number to users if they don't exist
			IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'country_code') THEN
				ALTER TABLE users ADD COLUMN country_code VARCHAR(10);
				RAISE NOTICE 'Added country_code column to users table';
			END IF;
			
			IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'phone_number') THEN
				ALTER TABLE users ADD COLUMN phone_number VARCHAR(20);
				RAISE NOTICE 'Added phone_number column to users table';
			END IF;

			-- Add status column to event_participants if it doesn't exist
			IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'event_participants' AND column_name = 'status') THEN
				ALTER TABLE event_participants ADD COLUMN status VARCHAR(20) DEFAULT 'pending' NOT NULL;
				RAISE NOTICE 'Added status column to event_participants table';
			END IF;

			-- Check if location column exists in events table
			IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'location') THEN
				ALTER TABLE events ADD COLUMN location TEXT;
				RAISE NOTICE 'Added location column to events table';
			END IF;
		END;
		$$;
	`)

	if err != nil {
		log.Printf("Warning: Error updating users table schema: %v\n", err)
	} else {
		log.Println("Successfully updated database schema")
	}
}

// SetupDatabase initializes the database schema if needed
func SetupDatabase(db *sql.DB) {
	log.Println("Checking database setup...")

	// First check if tables already exist
	tableStatus, err := CheckTablesExist(db)
	if err != nil {
		log.Printf("Warning: Error checking if tables exist: %v\n", err)
	}

	// Check if all tables exist
	allTablesExist := true
	for table, exists := range tableStatus {
		if !exists {
			allTablesExist = false
			log.Printf("Table '%s' needs to be created", table)
		}
	}

	if allTablesExist {
		log.Println("All database tables already exist, skipping setup")

		// Even if all tables exist, we need to ensure they have the latest schema
		// This is particularly important for adding new columns to existing tables
		UpdateExistingTables(db)
		return
	}

	// Check if we have permission to create tables
	hasPermission, err := CheckTablePermissions(db)
	if err != nil {
		log.Printf("Warning: Error checking table permissions: %v\n", err)
	}

	if !hasPermission {
		log.Println("WARNING: The database user does not have permission to create tables")
		log.Println("This is common with managed databases like DigitalOcean PostgreSQL")
		log.Println("Please create the tables manually or grant the necessary permissions")
		log.Println("The application will continue to run, but may fail if tables don't exist")
		return
	}

	// We have permission to create tables, proceed with setup
	log.Println("Setting up database tables...")

	// Try to create the uuid-ossp extension (may fail on managed databases)
	_, extensionErr := db.Exec(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`)
	if extensionErr != nil {
		log.Printf("Warning: Could not create uuid-ossp extension: %v\n", extensionErr)
		log.Println("This is normal for managed databases where the user doesn't have superuser privileges.")
	}

	// Try to create the enum type
	_, enumErr := db.Exec(`
		DO $$ 
		BEGIN
			IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'sender_type') THEN
				CREATE TYPE sender_type AS ENUM ('user', 'ai');
			END IF;
		EXCEPTION WHEN insufficient_privilege THEN
			RAISE NOTICE 'No permission to create enum type';
		END $$;
	`)
	if enumErr != nil {
		log.Printf("Warning: Could not create sender_type enum: %v\n", enumErr)
	}

	// Check if sender_type exists
	var senderTypeExists bool
	err = db.QueryRow("SELECT EXISTS(SELECT 1 FROM pg_type WHERE typname = 'sender_type')").Scan(&senderTypeExists)
	if err != nil {
		log.Printf("Warning: Could not check if sender_type exists: %v\n", err)
		// Continue execution as we'll attempt to create it anyway
	}

	// Create tables with proper error handling
	tables := []struct {
		name string
		def  string
	}{
		{
			name: "users",
			def: `CREATE TABLE IF NOT EXISTS users (
			id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
			first_name VARCHAR(100),
			last_name VARCHAR(100),
			email VARCHAR(255) UNIQUE NOT NULL,
			password TEXT NOT NULL,
			profile_picture TEXT,
			country_code VARCHAR(10),
			phone_number VARCHAR(20),
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		);`,
		},
		{
			name: "refresh_tokens",
			def: `CREATE TABLE IF NOT EXISTS refresh_tokens (
			id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
			user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			token VARCHAR(255) UNIQUE NOT NULL,
			expires_at TIMESTAMP NOT NULL,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		);`,
		},
		{
			name: "events",
			def: `CREATE TABLE IF NOT EXISTS events (
			id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
			title VARCHAR(255) NOT NULL,
			description TEXT,
			creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			start_date TIMESTAMP NOT NULL,
			end_date TIMESTAMP,
			active BOOLEAN DEFAULT true,
			banner TEXT,
			location TEXT,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		);`,
		},
		{
			name: "event_participants",
			def: `CREATE TABLE IF NOT EXISTS event_participants (
			event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
			user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			status VARCHAR(20) DEFAULT 'pending' NOT NULL,
			PRIMARY KEY (event_id, user_id)
		);`,
		},

		{
			name: "translations",
			def: `CREATE TABLE IF NOT EXISTS translations (
			id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
			language_code VARCHAR(10) NOT NULL,
			key VARCHAR(255) NOT NULL,
			value TEXT NOT NULL,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			UNIQUE(language_code, key)
		);`,
		},
	}

	// Create tables one by one with proper error handling
	for _, table := range tables {
		_, err := db.Exec(table.def)
		if err != nil {
			log.Printf("Warning: Could not create table %s: %v\n", table.name, err)
		} else {
			log.Printf("Table '%s' created or already exists\n", table.name)
		}
	}

	log.Println("Database setup completed")
}
