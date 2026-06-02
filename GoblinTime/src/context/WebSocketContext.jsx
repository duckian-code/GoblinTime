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
        const ws = new WebSocket(`${wsUrl}/ws?token=${token}`);

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
        console.log("WS MESSAGE RECEIVED FROM SERVER -> Type:", type, "Payload:", payload);
        switch (type) {
            case 'CALL_INVITE':
                console.log("Checking payload properties before setting state:", {
                    roomName: payload?.roomName,
                    callerId: payload?.callerId,
                    callerName: payload?.callerName
                });
                setIncomingCall({
                    roomName: payload.roomName,
                    callerId: payload.callerId,
                    callerName: payload.callerName
                });
                setCallState('ringing');
                break;
            case 'CALL_ACCEPTED':
                setCallState("accepted");
                // TODO: TRIGGER JOIN LOGIC FOR LIVEKIT
                break;
            case 'CALL_REJECTED':
                setIncomingCall(null);
                setCallState("idle");
                break;
            case 'CALL_CANCELLED':
                setIncomingCall(null);
                setCallState("idle");
                break;
            case 'CALL_ENDED':
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
    // TODO: update call states here with proper states

    const initiateCall = (calleeId, roomName, callerId, callerName) => {

        const payload = {
            calleeId: calleeId,
            callerId: callerId,
            callerName: callerName,
            roomName: roomName
        };

        console.log("INITIATE CALL TRIGGERED:", payload);
        sendSignalingMessage("CALL_INVITE", payload);
        setCallState("ringing");
    }

    const acceptCall = () => {
        if(incomingCall) {
            sendSignalingMessage("CALL_ACCEPTED", { roomName: incomingCall.roomName });
            setCallState("accepted");
        }
    }

    const rejectCall = () => {
        console.log("DECLINE BUTTON CLICKED. Current incomingCall state is:", incomingCall)
        if(incomingCall) {
            const targetRoom = incomingCall.roomName;

            console.log("Sending CALL_REJECTED for room:", targetRoom);

            sendSignalingMessage("CALL_REJECTED", { roomName: targetRoom });
            setCallState("idle");
            setIncomingCall(null);
        }else {
            console.warn(" rejectCall ran, but incomingCall state was completely null/empty!");
        }
    }

    const cancelCall = (roomName) => {
        sendSignalingMessage("CALL_CANCELLED", { roomName });
        setCallState("idle");
    }

    const endCall = (roomName) => {
        sendSignalingMessage("CALL_ENDED", { roomName });
        setCallState("idle");
    };

    return (
        <WebSocketContext.Provider value={{ connectWs, incomingCall, callState, initiateCall, acceptCall, rejectCall, cancelCall, endCall }}> {children} </WebSocketContext.Provider>
    );
};