import express from 'express';
import http from 'http';
import WebSocket, { WebSocketServer } from 'ws';
import url from 'url';

type CallState = 'ringing' | 'accepted' | 'ended' | 'rejected' | 'cancelled';

interface CallSession {
    roomName: string;
    callerId: string;
    calleeId: string;
    state: CallState;
}

const clients = new Map<string, WebSocket>();
const sessions = new Map<string, CallSession>(); // Keyed by roomName

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

wss.on('connection', async (ws: WebSocket, req: http.IncomingMessage) => {
    // 1. Accept connections on /ws and extract token
    const parameters = url.parse(req.url || '', true).query;
    const token = parameters.token as string;

    if (!token) {
        ws.close(1008, 'Token required');
        return;
    }

    let userId: string;

    try {
        // TODO: REPLACE WITH ACTUAL DEFAULT
        const serviceUrl = process.env.USER_SERVICE_URL || "http://localhost:3000";
        const endpoint = process.env.USER_ENDPOINT || "api/users/";

        const targetUrl = `${serviceUrl}/${endpoint}`;

        const response = await fetch(targetUrl, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
        });

        if (!response.ok) {
            throw new Error(`User Service responded with status: ${response.status}`);
        }

        const data = await response.json();

        if (!data.uuid) {
            throw new Error('User Service did not return a valid UUID');
        }

        userId = data.uuid;

    } catch (err) {
        console.error('Authentication failed:', err);
        // 1008 is the standard WebSocket closure code for policy violations / unauthorized access
        ws.close(1008, 'Authentication failed');
        return;
    }

    clients.set(userId, ws);
    console.log(`User connected: ${userId}`);

    ws.on('message', (message: string) => {
        try {
            const parsedMessage = JSON.parse(message);
            handleSignalingMessage(userId, parsedMessage);
        } catch (error) {
            console.error('Failed to parse message:', error);
        }
    });

    ws.on('close', () => {
        console.log(`User disconnected: ${userId}`);
        clients.delete(userId);
    });
});

function handleSignalingMessage(senderId: string, msg: any) {
    const { type, payload } = msg;

    switch (type) {
        case 'CALL_INVITE': {
            const { roomName, callerId, callerName, calleeId } = payload;
            // TODO: IS REMOVING CALLEEID GOOD?
            sessions.set(roomName, {
                roomName,
                callerId,
                calleeId,
                state: 'ringing'
            });

            const targetConn = clients.get(calleeId);
            if (targetConn && targetConn.readyState === WebSocket.OPEN) {
                targetConn.send(JSON.stringify({
                    type: 'CALL_INVITE',
                    payload: { roomName, callerId, callerName }
                }));
            } else {
                console.log(`Target user ${calleeId} is not connected.`);
            }
            break;
        }

        case 'CALL_ACCEPTED': {
            const { roomName } = payload;
            const session = sessions.get(roomName);

            if (session) {
                session.state = 'accepted';
                const targetConn = clients.get(session.callerId);
                if (targetConn && targetConn.readyState === WebSocket.OPEN) {
                    targetConn.send(JSON.stringify({
                        type: 'CALL_ACCEPTED',
                        payload: { roomName }
                    }));
                }
            }
            break;
        }

        case 'CALL_REJECTED': {
            const { roomName } = payload;
            const session = sessions.get(roomName);

            if (session) {
                session.state = 'rejected';
                const targetConn = clients.get(session.callerId);
                if (targetConn && targetConn.readyState === WebSocket.OPEN) {
                    targetConn.send(JSON.stringify({
                        type: 'CALL_REJECTED',
                        payload: { roomName }
                    }));
                }
                sessions.delete(roomName);
            }
            break;
        }

        case 'CALL_CANCELLED': {
            const { roomName } = payload;
            const session = sessions.get(roomName);

            if (session) {
                session.state = 'cancelled'
                const targetConn = clients.get(session.calleeId);
                if (targetConn && targetConn.readyState === WebSocket.OPEN) {
                    targetConn.send(JSON.stringify({ type: 'CALL_CANCELLED', payload: { roomName } }));
                }
                sessions.delete(roomName);
            }
            break;
        }

        case 'CALL_ENDED': {
            const { roomName } = payload;
            const session = sessions.get(roomName);

            if (session) {
                session.state = 'ended';
                const otherPartyId = senderId === session.callerId ? session.calleeId : session.callerId;
                const targetConn = clients.get(otherPartyId);

                if (targetConn && targetConn.readyState === WebSocket.OPEN) {
                    targetConn.send(JSON.stringify({ type: 'CALL_ENDED', payload: { roomName } }));
                }
                sessions.delete(roomName);
            }
            break;
        }

        default:
            console.warn(`Unknown message type: ${type}`);
    }
}

const PORT = process.env.PORT || 8090;
server.listen(PORT, () => {
    console.log(`Signaling server running on port ${PORT}`);
});