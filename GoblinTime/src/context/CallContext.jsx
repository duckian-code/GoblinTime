import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { Room } from 'livekit-client';

const CallContext = createContext(null);

export const useCallContext = () => {
    const context = useContext(CallContext);
    if (!context) {
        throw new Error('useCallContext must be used within a CallProvider');
    }
    return context;
};

export const CallProvider = ({ children }) => {
    // LiveKit state
    const [lkToken, setLkToken] = useState(null);
    const [lkUrl, setLkUrl] = useState(null);
    const [lkRoom, setLkRoom] = useState(null);
    const roomRef = useRef(null);
    const roomNameRef = useRef('');

    // Call UI state
    const [isCalling, setIsCalling] = useState(false);
    const [callTarget, setCallTarget] = useState('');
    const [caller, setCaller] = useState('');
    const [isReceivingCall, setIsReceivingCall] = useState(false);

    const getCookie = (name) => {
        const cookie = document.cookie
            .split("; ")
            .find((row) => row.startsWith(`${name}=`));
        return cookie ? decodeURIComponent(cookie.split("=")[1]) : "";
    };

    const joinLiveKitRoom = useCallback(async (roomName, username) => {

        const token = getCookie('token');

        const targetUrl = `/video/token`
        console.log(`Shipping request to LiveKit token generator: ${targetUrl}`);

        try {
            const response = await fetch(targetUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    roomName: roomName,
                    username: username
                }),
            });

            if (!response.ok) {
                throw new Error(`Failed to get LiveKit token: ${response.status}`);
            }

            const data = await response.json();
            const liveKitToken = data.video_token;

            const liveKitUrl = "wss://livekit.goblin-ti.me";
            const room = new Room();
            roomRef.current = room;
            roomNameRef.current = roomName;

            console.log(`Connecting room instance to LiveKit: ${liveKitUrl}`);
            await room.connect(liveKitUrl, liveKitToken);

            await room.localParticipant.enableCameraAndMicrophone();
            console.log("Local camera and microphone tracks successfully published.");

            setLkToken(liveKitToken);
            setLkUrl(liveKitUrl);
            setLkRoom(room);
        } catch (err) {
            console.error('Failed to join LiveKit room:', err);
            throw err;
        }
    }, []);

    const leaveLiveKitRoom = useCallback((endCallFn) => {
        if (roomRef.current) {
            roomRef.current.disconnect();
            roomRef.current = null;
        }
        setLkRoom(null);
        setLkToken(null);
        setLkUrl(null);
        setIsCalling(false);
        setCallTarget('');
        setCaller('');
        setIsReceivingCall(false);

        if (endCallFn && typeof endCallFn === 'function') {
            endCallFn(roomNameRef.current);
        }
        roomNameRef.current = '';
    }, []);

    const value = {
        // LiveKit
        lkToken,
        lkUrl,
        lkRoom,
        joinLiveKitRoom,
        leaveLiveKitRoom,
        // Call UI
        isCalling,
        setIsCalling,
        callTarget,
        setCallTarget,
        caller,
        setCaller,
        isReceivingCall,
        setIsReceivingCall,
    };

    return (
        <CallContext.Provider value={value}>
            {children}
        </CallContext.Provider>
    );
};