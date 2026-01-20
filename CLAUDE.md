# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Important Instructions

Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.

## Code Quality Standards

### Import Management Rules
**NEVER import modules or libraries inside functions/methods.** This is an anti-pattern that causes:
- Performance overhead (imports happen every function call)
- Code clarity issues (imports should be visible at module level)
- Circular import masking
- IDE/tooling problems
- Static analysis failures

**✅ CORRECT - All imports at module level:**
```go
// At top of file
import (
    "time"
    "github.com/gin-gonic/gin"
    "github.com/golang-jwt/jwt/v5"
)

func myFunction() {
    // Use imported packages directly
    currentTime := time.Now()
}
```

**❌ INCORRECT - Imports inside functions** - Not applicable in Go but avoid lazy loading patterns

### Other Code Quality Rules
- Follow established patterns in the codebase
- Write comprehensive tests for new functionality
- Use proper error handling with appropriate HTTP status codes
- Include audit logging for security-sensitive operations
- Never include sensitive information (API keys, tokens) in code or commits

## Project Overview

Geoffray is a full-stack application with:
- **Frontend**: React Native/Expo mobile app in `fe-geoffray/`
- **Backend**: Go API server with comprehensive features in `be-geoffray/`
  - JWT-based authentication system
  - Event management (create, join, manage events)
  - Chat with Mistral AI integration
  - Flight search via Amadeus API
  - Multi-language localization support
  - PostgreSQL database with migrations

## Commands

### Frontend (fe-geoffray/)

```bash
# Install dependencies
npm install

# Start development server
npx expo start

# Platform-specific starts
npm run ios       # iOS simulator
npm run android   # Android emulator
npm run web       # Web browser

# Testing and linting
npm test          # Run tests with Jest
npm run lint      # Run ESLint

# Reset project to fresh state
npm run reset-project
```

### Backend (be-geoffray/)

```bash
# Setup environment
cp .env.example .env
# Edit .env with database credentials, JWT secret, API keys

# Start PostgreSQL database
docker compose up -d

# Install dependencies
go mod download

# Run server (default port 8080)
go run cmd/main.go

# Build binary
go build -o bin/api cmd/main.go

# Run tests
go test ./...

# Database management
docker compose down        # Stop database
docker compose down -v      # Remove all data
docker compose logs postgres # View logs
```

## Architecture

### Frontend Structure
- **Expo Router**: File-based routing with tabs navigation
- **Components**: 
  - Reusable UI components in `src/components/`
  - Platform-specific components (`.ios.tsx` vs `.tsx`)
  - Themed components for consistent styling
  - Authentication, event management, and chat components
- **API Layer**: Organized in `src/api/` with separate modules for auth, events, chat
- **Localization**: Multi-language support with i18next in `src/localization/`
- **Styling**: Uses `Colors` constants and `useColorScheme` hook for theme support
- **TypeScript**: Strict mode enabled with path alias `@/*`
- **Storage**: Cross-platform storage abstraction for tokens and user data

### Backend Structure
- **API Framework**: Gin for HTTP routing and middleware
- **Database**: PostgreSQL with native SQL (lib/pq driver)
- **Authentication**: JWT-based (jwt/v5) with refresh tokens
- **AI Integration**: Mistral AI for chat, Amadeus for flights
- **Payment**: Stripe integration
- **Localization**: Multi-language support with JSON translations
- **Directory Layout**:
  - `api/` - Controllers, middlewares, routes
  - `models/` - Data models (User, Event, Message, etc.)
  - `services/` - Business logic (Mistral, Amadeus, Events)
  - `config/` - Configuration management
  - `db/` - Database initialization and migrations

### Current Features
- **Frontend Tabs**:
  - Home - Main events listing and event management
  - Create Event - Event creation with location, date/time selection
  - Profile - User profile management with photo upload
  - Authentication - Login/signup flows with validation
  
- **Frontend Features**:
  - Multi-language support (English/French)
  - Event creation and management
  - User authentication and profile management
  - Chat functionality with AI integration
  - Location autocomplete and mapping
  - Date/time pickers (cross-platform)
  - Event invitations and participant management

- **Backend Endpoints** (fully implemented):
  - `/auth/register` - User registration
  - `/auth/login` - User login with JWT
  - `/auth/refresh` - Refresh JWT token
  - `/events/*` - Event CRUD operations
  - `/events/join/{id}` - Join an event
  - `/events/me` - User's events
  - `/chat/` - Send chat message to AI
  - `/chat/stream` - Stream chat responses (SSE)
  - `/chat/event/{eventId}` - Get event chat history
  - `/flights/*` - Flight search endpoints
  - `/health` - Health check

## Key Dependencies

### Frontend
- React Native 0.79.2 + React 19.0.0
- Expo SDK 53
- Expo Router for navigation
- React Native Reanimated for animations
- TypeScript with strict mode
- Additional packages: AsyncStorage, DateTimePicker, i18next, SecureStore

### Backend
- Go 1.21+
- gin-gonic/gin v1.10.0 - HTTP framework
- gin-contrib/cors v1.7.5 - CORS middleware
- golang-jwt/jwt/v5 v5.2.2 - JWT authentication
- lib/pq v1.10.9 - PostgreSQL driver
- google/uuid v1.3.0 - UUID generation
- stripe-go/v74 - Payment processing
- golang.org/x/crypto - Password hashing
- godotenv v1.5.1 - Environment configuration

## Development Notes

- Frontend migrated from rendez-vous-front codebase with full feature set
- Frontend uses SF Symbols icons via `IconSymbol` component
- API configuration points to local backend (`http://localhost:8080`)
- CORS is configured for all origins in development (handled by Gin middleware)
- Environment variables loaded from `.env` file in backend
- Mobile app uses haptic feedback for tab switches
- TypeScript path aliases configured as `@/*` pointing to project root
- Backend requires PostgreSQL database (via Docker Compose)
- JWT tokens expire in 24h by default (configurable)
- Mistral AI and Amadeus APIs are optional but enhance chat functionality
- Database migrations run automatically on startup
- Frontend includes comprehensive test suite with React Native Testing Library
- Cross-platform storage handling for user data and authentication tokens

## Claude Code Best Practices

### Context Management
- Use `/clear` between different tasks to maintain focus
- This CLAUDE.md file is automatically loaded for context
- Create custom slash commands for repeated workflows

### Git Integration Best Practices
When working with git:
```bash
# Create meaningful commits
git commit -m "feat: implement feature description"
git commit -m "fix: resolve specific issue"
git commit -m "refactor: improve code structure"

# Create PRs with gh CLI
gh pr create --title "Clear PR title" --body "Description of changes"
```

**IMPORTANT**: NEVER include "Co-Authored-By" lines in commit messages.

### Parallel Development with Git Worktrees
For working on multiple features simultaneously:
```bash
# Create worktrees for parallel development
git worktree add ../geoffray-feature-auth feature/auth
git worktree add ../geoffray-feature-api feature/api

# Run Claude Code in each worktree
cd ../geoffray-feature-auth && claude
cd ../geoffray-feature-api && claude
```

### Session Management
- Use `/clear` frequently to maintain focused context
- Configure tool allowlist to streamline permissions
- Use headless mode for automation: `claude -p "specific task"`