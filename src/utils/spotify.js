import { db } from './firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';

const CLIENT_ID = process.env.REACT_APP_SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.REACT_APP_SPOTIFY_CLIENT_SECRET;

// Verify environment variables are loaded
if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('Missing Spotify credentials. Please check your .env file.');
}

const REDIRECT_URI = process.env.NODE_ENV === 'production' 
  ? "https://knock-eb7b5.firebaseapp.com/spotify-callback"
  : "http://localhost:3000/spotify-callback";
const SCOPES = [
  'user-read-private',
  'user-read-email',
  'user-top-read',
  'playlist-read-private'
].join(' ');

// Generate a random string for PKCE
function generateCodeVerifier(length) {
    let text = '';
    let possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

// Generate code challenge for PKCE
async function generateCodeChallenge(codeVerifier) {
    const data = new TextEncoder().encode(codeVerifier);
    const digest = await window.crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode.apply(null, [...new Uint8Array(digest)]))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}

// Initiate Spotify auth flow
export const initiateSpotifyLogin = () => {
  if (!CLIENT_ID) {
    console.error('Spotify Client ID is not configured');
    throw new Error('Spotify Client ID is not configured');
  }

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: 'code',
    redirect_uri: REDIRECT_URI,
    scope: SCOPES,
    show_dialog: true
  });

  window.location.href = `https://accounts.spotify.com/authorize?${params.toString()}`;
};

// Handle the callback from Spotify
export const handleSpotifyCallback = async (code, userId) => {
    try {
        const response = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                Authorization: `Basic ${btoa(`${CLIENT_ID}:${process.env.REACT_APP_SPOTIFY_CLIENT_SECRET}`)}`,
            },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                code,
                redirect_uri: REDIRECT_URI,
            }),
        });

        if (!response.ok) {
            throw new Error('Failed to get access token');
        }

        const data = await response.json();
        
        // Get user's Spotify profile
        const profileResponse = await fetch('https://api.spotify.com/v1/me', {
            headers: {
                Authorization: `Bearer ${data.access_token}`,
            },
        });

        if (!profileResponse.ok) {
            throw new Error('Failed to get Spotify profile');
        }

        const profile = await profileResponse.json();

        // Update user's profile in Firestore
        const userRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
            await updateDoc(userRef, {
                spotifyProfile: {
                    id: profile.id,
                    uri: profile.uri,
                    href: profile.href,
                    displayName: profile.display_name,
                    images: profile.images,
                    followers: profile.followers.total,
                },
                spotifyTokens: {
                    accessToken: data.access_token,
                    refreshToken: data.refresh_token,
                    expiresAt: Date.now() + (data.expires_in * 1000),
                },
            });
        }

        return profile;
    } catch (error) {
        console.error('Error in handleSpotifyCallback:', error);
        throw error;
    }
};

// Fetch user's Spotify profile
export async function fetchSpotifyProfile(accessToken) {
    const response = await fetch("https://api.spotify.com/v1/me", {
        headers: { Authorization: `Bearer ${accessToken}` }
    });
    return await response.json();
}

// Get user's top tracks
export async function fetchUserTopTracks(accessToken) {
    const response = await fetch("https://api.spotify.com/v1/me/top/tracks?limit=5", {
        headers: { Authorization: `Bearer ${accessToken}` }
    });
    return await response.json();
}

// Refresh the access token
export const refreshSpotifyToken = async (userId) => {
    try {
        const userRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userRef);

        if (!userDoc.exists()) {
            throw new Error('User not found');
        }

        const { spotifyTokens } = userDoc.data();
        
        if (!spotifyTokens?.refreshToken) {
            throw new Error('No refresh token available');
        }

        const response = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                Authorization: `Basic ${btoa(`${CLIENT_ID}:${process.env.REACT_APP_SPOTIFY_CLIENT_SECRET}`)}`,
            },
            body: new URLSearchParams({
                grant_type: 'refresh_token',
                refresh_token: spotifyTokens.refreshToken,
            }),
        });

        if (!response.ok) {
            throw new Error('Failed to refresh token');
        }

        const data = await response.json();

        // Update tokens in Firestore
        await updateDoc(userRef, {
            'spotifyTokens.accessToken': data.access_token,
            'spotifyTokens.expiresAt': Date.now() + (data.expires_in * 1000),
        });

        return data.access_token;
    } catch (error) {
        console.error('Error refreshing Spotify token:', error);
        throw error;
    }
}; 