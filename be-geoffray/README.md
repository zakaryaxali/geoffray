# BE-Geoffray Backend

Backend service for the Geoffray application, providing authentication, event management, and chat with AI capabilities.

## Features

- **Authentication System** - JWT-based user authentication
- **Event Management** - Create, manage, and join events
- **Chat with AI** - Mistral AI integration for conversational capabilities
- **Localization** - Multi-language support with translation system
- **Payment Processing** - Stripe integration for payments

## Prerequisites

- Go 1.21 or higher
- PostgreSQL (via Docker or local installation)
- Docker & Docker Compose (for database)

## Quick Setup

### 1. Environment Setup

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your configuration
# Required: Database credentials, JWT secret
# Optional: Mistral API keys for AI features
```

### 2. Start the Database

```bash
# Build and start PostgreSQL in detached mode
docker compose up -d --build

# Verify database is running
docker compose ps
```

### 3. Install Dependencies & Run

```bash
# Install Go dependencies
go mod download

# Run the server (default port 8080)
go run cmd/main.go
```

## API Documentation

### Authentication

#### Register
```bash
POST /auth/register
Content-Type: application/json

{
    "username": "your_username",
    "email": "your_email@example.com",
    "password": "your_password"
}
```

#### Login
```bash
POST /auth/login
Content-Type: application/json

{
    "email": "your_email@example.com",
    "password": "your_password"
}

# Response
{
    "token": "your_jwt_token"
}
```

### Events API

All event endpoints require authentication via `Authorization: Bearer <token>` header.

#### Create Event
```bash
POST /events
Authorization: Bearer <your_token>
Content-Type: application/json

{
    "title": "Event Title",
    "description": "Event Description",
    "start_date": "2025-04-01T15:00:00Z",
    "end_date": "2025-04-01T18:00:00Z",
    "banner": "optional-banner-url"
}
```

#### Get User's Events
```bash
GET /events/me
Authorization: Bearer <your_token>
```

#### Join Event
```bash
POST /events/join/{eventId}
Authorization: Bearer <your_token>
```

### Chat API

#### Stream Chat (SSE)
```bash
POST /chat/stream
Authorization: Bearer <your_token>
Content-Type: application/json

{
    "message": "Your message here"
}
```

#### Send Chat
```bash
POST /chat/
Authorization: Bearer <your_token>
Content-Type: application/json

{
    "message": "Your message here"
}
```


### Health Check

```bash
GET /health

# Response
{
    "status": "ok",
    "message": "Service is healthy"
}
```

## Project Structure

```
be-geoffray/
├── api/
│   ├── controllers/     # HTTP request handlers
│   ├── middlewares/     # JWT auth, CORS, language
│   └── routes/          # Route definitions
├── cmd/
│   └── main.go          # Application entry point
├── config/              # Configuration management
├── db/                  # Database initialization
├── localization/        # Translation system
├── models/              # Data models
├── services/            # Business logic
│   ├── mistral_service.go # AI chat service
│   └── event_service.go # Event management
├── docker-compose.yml   # PostgreSQL setup
└── .env.example         # Environment template
```

## Development

### Database Management

```bash
# Stop database
docker compose down

# Remove all data (careful!)
docker compose down -v

# View database logs
docker compose logs postgres
```

### Testing

```bash
# Run all tests
go test ./...

# Run with coverage
go test -cover ./...
```

### Building

```bash
# Build binary
go build -o bin/api cmd/main.go

# Run binary
./bin/api
```

## Configuration

Key environment variables:

- `DB_*` - Database connection settings
- `JWT_SECRET` - Secret key for JWT tokens
- `MISTRAL_API_KEY` - For AI chat features
- `STRIPE_SECRET_KEY` - For payment processing
- `GIN_MODE` - Set to "release" for production

## API Integration

This backend is designed to work with:
- React Native/Expo frontend (fe-geoffray)
- Any client that supports JWT authentication
- Server-Sent Events (SSE) for chat streaming

## License

Proprietary - Geoffray Application