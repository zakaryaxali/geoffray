package db

import (
	"database/sql"
	"embed"
	"fmt"
	"log"

	"github.com/golang-migrate/migrate/v4"
	"github.com/golang-migrate/migrate/v4/database/postgres"
	"github.com/golang-migrate/migrate/v4/source/iofs"
)

//go:embed migrations/*.sql
var migrationFS embed.FS

// RunMigrations executes all pending database migrations
func RunMigrations(db *sql.DB) error {
	log.Println("Starting database migrations...")

	// Create driver instance
	driver, err := postgres.WithInstance(db, &postgres.Config{})
	if err != nil {
		return fmt.Errorf("could not create migration driver: %w", err)
	}

	// Create source instance from embedded files
	source, err := iofs.New(migrationFS, "migrations")
	if err != nil {
		return fmt.Errorf("could not create migration source: %w", err)
	}

	// Create migrate instance
	m, err := migrate.NewWithInstance("iofs", source, "postgres", driver)
	if err != nil {
		return fmt.Errorf("could not create migrate instance: %w", err)
	}

	// Get current version before migration
	currentVersion, dirty, versionErr := m.Version()
	if versionErr != nil && versionErr != migrate.ErrNilVersion {
		log.Printf("Warning: Could not get current migration version: %v", versionErr)
	}

	if dirty {
		log.Printf("WARNING: Database is in dirty state at version %d", currentVersion)
		log.Println("You may need to manually fix the database state or force the version")
		return fmt.Errorf("database is in dirty state at version %d", currentVersion)
	}

	// Run migrations
	if err := m.Up(); err != nil {
		if err == migrate.ErrNoChange {
			if versionErr == migrate.ErrNilVersion {
				log.Println("No migrations have been applied yet, and no new migrations to apply")
			} else {
				log.Printf("Database is already up to date at version %d", currentVersion)
			}
			return nil
		}
		return fmt.Errorf("could not run migrations: %w", err)
	}

	// Get final version
	finalVersion, _, err := m.Version()
	if err != nil {
		log.Printf("Warning: Could not get final migration version: %v", err)
	} else {
		log.Printf("Successfully migrated database from version %d to version %d", currentVersion, finalVersion)
	}

	log.Println("Migrations completed successfully")
	return nil
}

// CheckMigrationStatus returns the current migration status
func CheckMigrationStatus(db *sql.DB) error {
	log.Println("Checking migration status...")

	// Create driver instance
	driver, err := postgres.WithInstance(db, &postgres.Config{})
	if err != nil {
		return fmt.Errorf("could not create migration driver: %w", err)
	}

	// Create source instance from embedded files
	source, err := iofs.New(migrationFS, "migrations")
	if err != nil {
		return fmt.Errorf("could not create migration source: %w", err)
	}

	// Create migrate instance
	m, err := migrate.NewWithInstance("iofs", source, "postgres", driver)
	if err != nil {
		return fmt.Errorf("could not create migrate instance: %w", err)
	}

	// Get current version
	version, dirty, err := m.Version()
	if err != nil {
		if err == migrate.ErrNilVersion {
			log.Println("No migrations have been applied yet")
			return nil
		}
		return fmt.Errorf("could not get migration version: %w", err)
	}

	if dirty {
		log.Printf("WARNING: Database is in dirty state at version %d", version)
	} else {
		log.Printf("Database is at migration version: %d", version)
	}

	return nil
}
