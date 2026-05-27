import React, {createContext, useState, useEffect, useRef} from 'react';

const WebSocketContext = createContext(null);

export const useWebSocket = () => React.useContext(WebSocketContext);

export const WebSocketProvider = ({ children }) => {
    const [incomingCall, setIncomingCall] = useState(null);
    const [callState, setCallState] = useState("idle"); // idle, ringing, accepted
    const wsRef = useRef(null);

    const getToken = () => {
        const cookie = document.cookie
            .split("; ")
            .find((row) => row.startsWith(`token=`));

        return cookie ? decodeURIComponent(cookie.split("=")[1]) : "";
    };

    const connectWs = () => {
        const token = getToken();
        if (!token || wsRef.current) return; {} // prevent duplicate or invalid

        const wsUrl = window.__ENV__?.VITE_WS_URL || "";
        const ws = new WebSocket(`${wsUrl}/ws/token=${token}`);

        ws.onopen = () => console.log("WebSocket connection established");

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            handleIncomingMessage(data);
        };

        ws.onclose = () => {
            console.log("WebSocket connection closed");
            wsRef.current = null;
        };

        wsRef.current = ws;
    };

    const handleIncomingMessage = (data) => {
        const { type, payload } = data;
        switch (type) {
            case "CALL_INVITE":
                setIncomingCall(payload);
                setCallState("ringing");
                break;
            case "CALL_ACCEPTED":
                setCallState("accepted");
                // TODO: TRIGGER JOIN LOGIC FOR LIVEKIT
                break;
            case "CALL_REJECTED":
            case "CALL_CANCELLED":
            case "CALL_ENDED":
                setIncomingCall(null);
                setCallState("idle");
                break;
            default:
                console.log("Unknown message type:", type);
                break;
        }
    };

    const sendSignalingMessage = (type, payload) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type, payload }));
        }
    };

    const initiateCall = (calleeId, roomName, callerId, callerName) => {
        sendSignalingMessage("CALL_INVITE", { calleeId, roomName, callerId, callerName });
        setCallState("ringing");
    }

    const acceptCall = () => {
        if(incomingCall) {
            sendSignalingMessage("CALL_ACCEPTED", { roomName: incomingCall.roomName.roomName });
            setCallState("accepted");
        }
    }

    const rejectCall = () => {
        if(incomingCall) {
            sendSignalingMessage("CALL_REJECTED", { roomName: incomingCall.roomName.roomName });
            setCallState("idle");
        }
    }

    const cancelCall = (roomName) => {
        if(incomingCall) {
            sendSignalingMessage("CALL_CANCELLED", { roomName });
            setCallState("idle");
        }
    }

    const endCall = (roomName) => {
        if(incomingCall) {
            sendSignalingMessage("CALL_ENDED", { roomName });
            setCallState("idle");
        }
    };

    return (
        <WebSocketContext.Provider value={{ connectWs, incomingCall, callState, initiateCall, acceptCall, rejectCall, cancelCall, endCall }}> {children} </WebSocketContext.Provider>
    );
};