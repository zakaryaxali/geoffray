# BE-Geoffray

Backend service for the Geoffray application, providing authentication, payment processing, and data presentation services.

## Features

- Authentication system
- Payment processing
- API endpoints for data presentation
- Secure communication with frontend

## Prerequisites

- Go 1.21 or higher
- PostgreSQL (for database)
- Docker (optional, for containerization)

## Setup

1. Install Go from https://golang.org/dl/
2. Clone this repository
3. Install dependencies:
   ```
   go mod download
   ```
4. Set up environment variables (copy `.env.example` to `.env` and fill in the values)
5. Run the server:
   ```
   go run cmd/api/main.go
   ```

## Project Structure

```
be-geoffray/
├── cmd/
│   └── api/            # Application entrypoint
├── internal/
│   ├── auth/           # Authentication logic
│   ├── payment/        # Payment processing
│   ├── handlers/       # HTTP handlers
│   ├── middleware/     # HTTP middleware
│   └── models/         # Data models
├── pkg/                # Public packages
└── configs/            # Configuration files
```

## API Documentation

API documentation will be available at `/swagger/index.html` when the server is running.
