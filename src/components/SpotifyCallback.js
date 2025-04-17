import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { handleSpotifyCallback } from '../utils/spotify';
import { useAuth } from '../contexts/AuthContext';

const SpotifyCallback = () => {
    const navigate = useNavigate();
    const { currentUser } = useAuth();

    useEffect(() => {
        const processCallback = async () => {
            try {
                // Get the code from URL
                const urlParams = new URLSearchParams(window.location.search);
                const code = urlParams.get('code');
                const error = urlParams.get('error');
                
                if (error) {
                    console.error('Spotify auth error:', error);
                    navigate('/profile?spotify=error');
                    return;
                }

                if (!code) {
                    console.error('No code found in URL');
                    navigate('/profile?spotify=error');
                    return;
                }

                // Process the callback
                await handleSpotifyCallback(code, currentUser.uid);
                
                // Redirect back to profile with success message
                navigate('/profile?spotify=success');
            } catch (error) {
                console.error('Error processing Spotify callback:', error);
                navigate('/profile?spotify=error');
            }
        };

        if (currentUser) {
            processCallback();
        } else {
            navigate('/profile?spotify=error');
        }
    }, [navigate, currentUser]);

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="p-8 bg-white rounded-lg shadow-md">
                <div className="flex flex-col items-center space-y-4">
                    <div className="w-12 h-12 border-t-2 border-b-2 border-rose-500 rounded-full animate-spin"></div>
                    <p className="text-gray-600">Connecting your Spotify account...</p>
                </div>
            </div>
        </div>
    );
};

export default SpotifyCallback; 