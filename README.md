# Geoffray

Full-stack event management application with AI-powered features, built with React Native/Expo and Go.

## Prerequisites

- **Frontend**: Node.js 18+, npm/yarn, Expo CLI
- **Backend**: Go 1.21+, Docker & Docker Compose
- **Database**: PostgreSQL (via Docker)
- **Authentication**: Firebase project with Authentication enabled
- **Optional**: Mistral API key for AI features, Stripe for payments

## Project Structure

```
geoffray/
├── fe-geoffray/          # React Native/Expo frontend
├── be-geoffray/          # Go backend API
└── CLAUDE.md            # AI assistant instructions
```

## Firebase Authentication Setup

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project named "geoffray" (or use existing)
3. Enable Authentication service
4. Configure authentication providers:
   - **Email/Password**: Enable in Authentication > Sign-in method
   - **Google Sign-In**: Enable and configure OAuth consent screen
   - **Apple Sign-In** (optional): Enable for iOS support

### 2. Frontend Configuration

#### Get Firebase Web Config
1. In Firebase Console, go to Project Settings > General
2. Add a Web app if not already created
3. Copy the Firebase configuration object

#### Configure Frontend Environment
```bash
cd fe-geoffray

# Create or update environment file
cat > .env.local << EOF
# Firebase Configuration
EXPO_PUBLIC_FIREBASE_API_KEY=your-api-key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
EXPO_PUBLIC_FIREBASE_APP_ID=your-app-id
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=your-measurement-id

# Backend API
EXPO_PUBLIC_API_BASE_URL=http://localhost:8080
EOF
```

### 3. Backend Configuration

#### Generate Service Account
1. In Firebase Console, go to Project Settings > Service Accounts
2. Click "Generate new private key" and download the JSON file
3. Convert to base64 for environment variable:

```bash
cd be-geoffray

# Convert service account to base64 (macOS/Linux)
base64 -i path/to/service-account-key.json | tr -d '\n' > service-account-base64.txt

# Or using openssl
openssl base64 -in path/to/service-account-key.json -out service-account-base64.txt -A
```

#### Configure Backend Environment
```bash
# Copy example environment file
cp .env.example .env

# Edit .env and add Firebase configuration
vim .env
```

Add the following to `.env`:
```env
# Firebase Configuration (required)
FIREBASE_SERVICE_ACCOUNT_BASE64=<paste-base64-encoded-service-account-here>

# Other required variables
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=geoffray_db
JWT_SECRET=your-secure-jwt-secret
```

### 4. Authentication Flow

#### How It Works
1. **Frontend**: Users authenticate via Firebase SDK (Google, Email/Password, Apple)
2. **Firebase**: Issues ID tokens after successful authentication
3. **Frontend**: Sends Firebase ID token to backend
4. **Backend**: Verifies token using Firebase Admin SDK
5. **Backend**: Creates/updates user in PostgreSQL database
6. **Backend**: Issues JWT for API authentication
7. **Frontend**: Uses JWT for subsequent API requests

#### Authentication Endpoints

**Single unified endpoint for all providers:**
```http
POST /auth/firebase
Content-Type: application/json

{
  "idToken": "<firebase-id-token>",
  "authProvider": "google" | "firebase" | "apple",
  "firstName": "optional-for-signup",
  "lastName": "optional-for-signup"
}

Response:
{
  "token": "<jwt-token>",
  "refresh_token": "<refresh-token>",
  "expires_in": 86400,
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe"
  }
}
```

## Quick Start

### Backend Setup
```bash
cd be-geoffray

# 1. Setup environment (see Firebase configuration above)
cp .env.example .env
# Edit .env with your configuration

# 2. Start PostgreSQL database
docker compose up -d

# 3. Install dependencies
go mod download

# 4. Run the server
go run cmd/main.go
# Server starts on http://localhost:8080
```

### Frontend Setup
```bash
cd fe-geoffray

# 1. Setup environment (see Firebase configuration above)
cp .env.example .env.local
# Edit .env.local with your Firebase config

# 2. Install dependencies
npm install

# 3. Start development server
npx expo start

# 4. Run on platform
# Press 'i' for iOS
# Press 'a' for Android
# Press 'w' for Web
```

## Testing Authentication

### Test with cURL
```bash
# 1. Get Firebase ID token (use Firebase Auth REST API or frontend)
# 2. Test backend authentication
curl -X POST http://localhost:8080/auth/firebase \
  -H "Content-Type: application/json" \
  -d '{
    "idToken": "<your-firebase-token>",
    "authProvider": "google"
  }'

# 3. Use returned JWT for API requests
curl http://localhost:8080/events/me \
  -H "Authorization: Bearer <jwt-token>"
```

## Deployment

### Backend Deployment
1. Build the Go binary:
   ```bash
   cd be-geoffray
   go build -o bin/api cmd/main.go
   ```

2. Set production environment variables:
   - `FIREBASE_SERVICE_ACCOUNT_BASE64` (required)
   - Database credentials
   - `JWT_SECRET` (use strong secret)
   - `GIN_MODE=release`

3. Run migrations and start server

### Frontend Deployment

#### Web (Vercel/Netlify)
```bash
npx expo export --platform web
# Deploy the 'dist' folder
```

#### Mobile (EAS Build)
```bash
# Install EAS CLI
npm install -g eas-cli

# Configure EAS
eas build:configure

# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android
```

## Security Notes

- **Never commit** `.env` files or service account keys
- **Always use** HTTPS in production
- **Rotate** JWT secrets regularly
- **Enable** Firebase App Check for additional security
- **Configure** CORS appropriately for production
- **Use** Firebase Security Rules for client-side data access

## Troubleshooting

### Common Issues

1. **"Firebase not initialized" error**
   - Ensure `FIREBASE_SERVICE_ACCOUNT_BASE64` is set correctly
   - Verify base64 encoding is valid
   - Check Firebase project ID matches

2. **Authentication fails with "Invalid Firebase ID token"**
   - Verify Firebase project configuration matches between frontend and backend
   - Ensure ID token hasn't expired (tokens expire after 1 hour)
   - Check that authentication provider is enabled in Firebase Console

3. **CORS errors in development**
   - Backend should have CORS middleware enabled for all origins in development
   - Ensure `EXPO_PUBLIC_API_BASE_URL` points to correct backend URL

4. **Database connection issues**
   - Verify PostgreSQL container is running: `docker compose ps`
   - Check database credentials in `.env`
   - Ensure database migrations have run

## Additional Resources

- [Firebase Authentication Docs](https://firebase.google.com/docs/auth)
- [Firebase Admin SDK for Go](https://firebase.google.com/docs/admin/setup#go)
- [Expo Firebase Integration](https://docs.expo.dev/guides/using-firebase/)
- [Project Documentation](./CLAUDE.md) - Development guidelines and architecture