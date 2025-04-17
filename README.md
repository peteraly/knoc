# Knock - Organic Blind Dating App

A women-first, comfort-focused dating experience that feels organic, curated, and safe — far from traditional dating apps.

## Features

- Minimalist onboarding flow
- AI-generated face preference selection
- Simple availability scheduling
- Smart matchmaking algorithm
- Push notifications for date alerts
- Curated date location suggestions

## Tech Stack

- React + TailwindCSS (Frontend)
- Firebase (Backend & Notifications)
- Mapbox (Location Services)
- Firebase Cloud Messaging (Push Notifications)

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file with your API keys:
   ```
   REACT_APP_FIREBASE_CONFIG=your_firebase_config
   REACT_APP_FIREBASE_SERVER_KEY=your_firebase_server_key
   REACT_APP_MAPBOX_ACCESS_TOKEN=your_mapbox_token
   ```
4. Start the development server:
   ```bash
   npm start
   ```

## Project Structure

```
/src
  /components
    - OnboardingForm.js
    - FaceSelection.js
    - AvailabilityPicker.js
  /utils
    - matcher.js
    - notificationSender.js
    - locationSuggester.js
  - App.js
  - index.js
```

## Firebase Setup

1. Create a Firebase project at [firebase.google.com](https://firebase.google.com)
2. Enable Authentication, Firestore, and Cloud Messaging
3. Add your web app to the project
4. Generate a Web Push certificate for Cloud Messaging
5. Add the Firebase configuration to your `.env` file

## Mapbox Setup

1. Create a Mapbox account at [mapbox.com](https://mapbox.com)
2. Generate an access token with the necessary scopes
3. Add the token to your `.env` file

## LinkedIn Authentication Setup

To properly set up LinkedIn authentication in Firebase, follow these steps:

### 1. Configure LinkedIn OAuth 2.0

1. Go to the [LinkedIn Developer Console](https://www.linkedin.com/developers/apps)
2. Select your app (bossi)
3. Go to the "Auth" tab
4. Make sure the following redirect URIs are added:
   - http://localhost:3000/auth/callback (for development)
   - https://knock-eb7b5.firebaseapp.com/auth/callback (for production)
5. Make sure the following scopes are enabled:
   - openid
   - profile
   - email
6. Copy your Client ID and Client Secret

### 2. Enable LinkedIn Authentication in Firebase

1. Go to the [Firebase Console](https://console.firebase.google.com)
2. Select your project (knock-eb7b5)
3. Go to Authentication > Sign-in method
4. Enable LinkedIn authentication
5. Add your LinkedIn OAuth 2.0 credentials:
   - Client ID: 78gxpbz0z1wt2s
   - Client Secret: (Your LinkedIn Client Secret)
   - Authorized redirect URIs:
     - http://localhost:3000/auth/callback (for development)
     - https://knock-eb7b5.firebaseapp.com/auth/callback (for production)

### 3. Verify Configuration

After setting up both LinkedIn and Firebase, you can verify the configuration by:

1. Running the app locally
2. Opening the browser console
3. Running `window.checkFirebaseConfig()`
4. Check the console output for any errors

## Development

### Prerequisites

- Node.js (v14 or later)
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start the development server
npm start
```

### Building for Production

```bash
npm run build
```

## Troubleshooting

If you encounter the "auth/configuration-not-found" error:

1. Make sure LinkedIn authentication is enabled in Firebase Console
2. Verify that the Client ID and Client Secret are correct
3. Check that the redirect URIs match in both LinkedIn and Firebase
4. Ensure the scopes match between LinkedIn and Firebase

For more help, refer to the [Firebase Authentication documentation](https://firebase.google.com/docs/auth/web/linkedin-auth).

## Contributing

Please read our contributing guidelines before submitting pull requests.

## License

This project is licensed under the MIT License. 