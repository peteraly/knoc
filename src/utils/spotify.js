import { db } from './firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';

const SPOTIFY_CLIENT_ID = process.env.REACT_APP_SPOTIFY_CLIENT_ID;
const SPOTIFY_REDIRECT_URI = process.env.REACT_APP_SPOTIFY_REDIRECT_URI;
const SPOTIFY_SCOPE = 'user-read-private user-read-email user-top-read user-read-recently-played user-read-currently-playing user-read-playback-state user-modify-playback-state';

export const getSpotifyAuthUrl = () => {
  const params = new URLSearchParams({
    client_id: SPOTIFY_CLIENT_ID,
    response_type: 'code',
    redirect_uri: SPOTIFY_REDIRECT_URI,
    scope: SPOTIFY_SCOPE,
    show_dialog: 'true'
  });

  return `https://accounts.spotify.com/authorize?${params.toString()}`;
};

export const exchangeCodeForToken = async (code) => {
  try {
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${btoa(`${SPOTIFY_CLIENT_ID}:${process.env.REACT_APP_SPOTIFY_CLIENT_SECRET}`)}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: SPOTIFY_REDIRECT_URI,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to exchange code for token');
    }

    return await response.json();
  } catch (error) {
    console.error('Error exchanging code for token:', error);
    throw error;
  }
};

export const refreshSpotifyToken = async (refreshToken) => {
  try {
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${btoa(`${SPOTIFY_CLIENT_ID}:${process.env.REACT_APP_SPOTIFY_CLIENT_SECRET}`)}`,
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to refresh token');
    }

    return await response.json();
  } catch (error) {
    console.error('Error refreshing token:', error);
    throw error;
  }
};

export const updateUserSpotifyTokens = async (userId, tokens) => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      spotifyAccessToken: tokens.access_token,
      spotifyRefreshToken: tokens.refresh_token || (await getDoc(userRef)).data()?.spotifyRefreshToken,
      spotifyTokenExpiry: Date.now() + tokens.expires_in * 1000,
    });
  } catch (error) {
    console.error('Error updating Spotify tokens:', error);
    throw error;
  }
};

export const getSpotifyProfile = async (accessToken) => {
  try {
    const response = await fetch('https://api.spotify.com/v1/me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch Spotify profile');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching Spotify profile:', error);
    throw error;
  }
};

export const getTopTracks = async (accessToken, timeRange = 'medium_term', limit = 5) => {
  try {
    const response = await fetch(
      `https://api.spotify.com/v1/me/top/tracks?time_range=${timeRange}&limit=${limit}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch top tracks');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching top tracks:', error);
    throw error;
  }
};

export const getRecentlyPlayed = async (accessToken, limit = 5) => {
  try {
    const response = await fetch(
      `https://api.spotify.com/v1/me/player/recently-played?limit=${limit}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch recently played tracks');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching recently played tracks:', error);
    throw error;
  }
};

export const initiateSpotifyLogin = () => {
  if (!SPOTIFY_CLIENT_ID) {
    console.error('Spotify Client ID is not configured');
    throw new Error('Spotify Client ID is not configured');
  }

  const authUrl = getSpotifyAuthUrl();
  window.location.href = authUrl;
};

export const handleSpotifyCallback = async (code, userId) => {
  try {
    const tokens = await exchangeCodeForToken(code);
    await updateUserSpotifyTokens(userId, tokens);
    
    const profile = await getSpotifyProfile(tokens.access_token);
    return profile;
  } catch (error) {
    console.error('Error in handleSpotifyCallback:', error);
    throw error;
  }
}; 