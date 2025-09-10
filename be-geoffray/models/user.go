package models

import "time"

type User struct {
	ID             string    `json:"id"`
	FirstName      string    `json:"first_name"`
	LastName       string    `json:"last_name"`
	Email          string    `json:"email"`
	Password       string    `json:"password"`
	ProfilePicture string    `json:"profile_picture"`
	CountryCode    string    `json:"country_code,omitempty"` // Will be omitted from JSON if empty
	PhoneNumber    string    `json:"phone_number,omitempty"` // Will be omitted from JSON if empty
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
}
