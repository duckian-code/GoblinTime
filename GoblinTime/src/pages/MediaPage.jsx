import {useRef, useState} from "react";
import { Room } from "livekit-client";
import { useCallContext } from "../context/CallContext.jsx";
import ToastNotification from "../components/ToastNotification.jsx";
import OutgoingCall from "../components/OutgoingCall.jsx";
import IncomingCall from "../components/IncomingCall.jsx";
import { useWebSocket } from "../context/WebSocketContext.jsx";
import { useEffect } from "react";
import { LiveKitRoom, VideoConference } from "@livekit/components-react";
import "@livekit/components-styles"; // Required for VideoConference UI
import { buildUrl } from "../utils/urlHelper.js";

function MediaPage() {
    const room = new Room();

    // call state values
    // From Call Context
    const {
        lkToken, lkUrl, lkRoom, joinLiveKitRoom, leaveLiveKitRoom,
        isCalling, setIsCalling, callTarget, setCallTarget,
        caller, setCaller, isReceivingCall, setIsReceivingCall
    } = useCallContext();

// From WebSocket Context
    const {
        callState, incomingCall, initiateCall, cancelCall, acceptCall, rejectCall, endCall
    } = useWebSocket();

    // caller side - listen for acceptance to join LiveKit
    useEffect(() => {
        const connectCaller = async () => {
            // If we are calling, and the state changes to accepted, and we aren't in a room yet
            if (isCalling && callState === 'accepted' && !lkRoom) {
                const data = await getUserData();
                await joinLiveKitRoom(roomName.current, data.username);
            }
        };
        connectCaller();
    }, [callState, isCalling, lkRoom]);

    // handle teardown - if websocket says CALL_ENDED or CALL_REJECTED, disconnect livekit
    useEffect(() => {
        if (callState === 'idle' && lkRoom) {
            leaveLiveKitRoom(); // Doesn't pass endCall, just cleans up local room
        }
    }, [callState, lkRoom]);

    const [currentRoom, setCurrentRoom] = useState(null);
    const [connected, setConnected] = useState(false);
    const [participants, setParticipants] = useState([]);
    const [localTracks, setLocalTracks] = useState([]);

    // TOAST STATE
    const [toastMessage, setToastMessage] = useState("");
    const [showToast, setShowToast] = useState(false);

    const contacts = [
        {username: "Anonymous Goblin", uuid: "1234567890"},
        // "Less Anonymous Goblin",acks, setLocalTracks] = useState([]);
        // "Super Anonymous Goblin"
    ];

    const simulateIncomingCall = (name) => {
        setCaller(name);
        setIsReceivingCall(true);
    };

    const [error, setError] = useState(null);

    const getCookie = (name) => {
        const cookie = document.cookie
            .split("; ")
            .find((row) => row.startsWith(`${name}=`));

        return cookie ? decodeURIComponent(cookie.split("=")[1]) : "";
    };

    const recommended = [
        "Gilbert",
        // "Godfrey",
        // "Gillard"
    ];

    const getUserData = async() => {
        setError(null);

        const token = getCookie("token");

        if (!token) {
            setError("Unable to load profile: JWT cookie was not found.");
            return;
        }

        const endpoint = window.__ENV__?.VITE_USER_ENDPOINT || ""

        try {
            const response = await fetch(endpoint, {
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

            console.log("User Service successful GET: ", data);

            setError(null);
            return data;
        } catch (err) {
            console.error("Profile Error: ", err);
            setError(err.message || "An error occurred while loading the profile. Please try again.");
        }
    }

    const roomName = useRef("");

    // CLICK HANDLERS
    const handleContactClick = async (contact) => {
        setCallTarget(contact.username);
        setIsCalling(true);
        console.log(`Initiating call to ${contact.username}...`);

        const data = await getUserData();
        if (!data) {
            console.error("Could not fetch user data to initiate call.");
            setIsCalling(false);
            return;
        }

        const currentId = data.uuid;
        const targetId = contact.uuid;
        roomName.current = `room-${currentId}-${targetId}`;

        initiateCall(targetId, roomName.current, currentId, data.username);
    };

    const handleCancelOutgoingCall = () => {
        if (roomName.current) {
            cancelCall(roomName.current);
        }

        setIsCalling(false);
        setCallTarget("");
        console.log("Outgoing call cancelled.");

        if (currentRoom) {
            currentRoom.disconnect();
            setCurrentRoom(null);
        }
    };

    const handleAddFriendClick = async (userName) => {
        const endpoint = window.__ENV__?.VITE_CONTACTS_ENDPOINT; // Replace with your actual endpoint
        const token = getCookie("token");

        try {
            // --- POST REQUEST SPACE ---

            const response = await fetch(targetUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ friend_username: userName }),
            });

            if (!response.ok) {
                throw new Error("Failed to add friend");
            }

            // Simulate successful POST request
            console.log(`Successfully sent friend request to ${userName}`);

            // Trigger Toast Notification
            setToastMessage(`${userName} Added as Contact`);
            setShowToast(true);

            // Hide toast after 3 seconds
            setTimeout(() => {
                setShowToast(false);
            }, 3000);

        } catch (err) {
            console.error("Error adding friend: ", err);
            setError("Could not add user. Please try again.");
        }
    };

    const fetchContacts = async(event) => {
        setError(null);
        // TODO: contacts endpoint

        const endpoint = window.__ENV__?.VITE_CONTACTS_ENDPOINT || ""
        const token = getCookie("token");

        try {
            const response = await fetch(endpoint, {
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
            console.log("User Service successful GET: ", data);

            return data;

        } catch (err) {
            console.error("Auth Error: ", err);
            setError(err.message || "An error occurred during authentication. Please try again.");
        }
    }

    const createRoom = async(event) => {
        setError(null);
        const serviceUrl = window.__ENV__?.VITE_LIVEKIT_SERVICE_URL || "";
    }

    const fetchRecommended = async(event) => {
        setError(null);

        const endpoint = window.__ENV__?.VITE_RECOMMENDED_ENDPOINT || ""
        const token = getCookie("token");

        try {
            const response = await fetch(endpoint, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
            });

            if (!response.ok) {
                throw new Error(`User Service Recommended responded with status: ${response.status}`);
            }

            const data = await response.json();
            console.log("User Service successful GET: ", data);

            return data;

        } catch (err) {
            console.error("Auth Error: ", err);
            setError(err.message || "An error occurred during authentication. Please try again.");
        }
    }

    void fetchContacts;
    void fetchRecommended;

    return (
        <div className="media-layout">
            <aside className="sidebar">
                <button onClick={() => simulateIncomingCall("John Goblin")}>Demo Incoming Call</button>

                <section>
                    {error && <p className="profile-error" style={{ color: "red"}}>{error}</p>}
                    <h3>Contacts</h3>
                    <ul style={{ listStyleType: 'none', padding: 0 }}>
                        {contacts.map((contact) => (
                            <li
                                key={contact.uuid} // Use the UUID as the React key
                                className="clickable-list-item"
                                onClick={() => handleContactClick(contact)}
                            >
                                - {contact.username}
                            </li>
                        ))}
                    </ul>
                </section>

                <section>
                    <h3>Recommended</h3>
                    <ul style={{ listStyleType: 'none', padding: 0 }}>
                        {recommended.map((item, index) => (
                            <li
                                key={index}
                                className="clickable-list-item"
                                onClick={() => handleAddFriendClick(item)}
                            >
                                + {item}
                            </li>
                        ))}
                    </ul>
                </section>
            </aside>

            <section className="media-content">
                {lkRoom && lkToken ? (
                    <div style={{ height: '100%', width: '100%' }}>
                        <LiveKitRoom
                            room={lkRoom} // Pass the manually created room instance
                            token={lkToken}
                            serverUrl={lkUrl}
                            data-lk-theme="default"
                            onDisconnected={() => {
                                // Trigger teardown and notify peer when user clicks End Call
                                leaveLiveKitRoom(endCall);
                            }}
                        >
                            <VideoConference />
                        </LiveKitRoom>
                    </div>
                ) : (
                    <div className="media-box">
                        <p>Ready to call a Goblin...</p>
                    </div>
                )}
            </section>

            {/* --- MODALS & NOTIFICATIONS --- */}

            {/* Outgoing Call */}
            <OutgoingCall
                // Only show if we initiated it AND the socket state is ringing
                isOpen={isCalling && callState === 'ringing' && !incomingCall}
                calleeName={callTarget}
                onCancel={handleCancelOutgoingCall}
            />

            {/* Incoming Call */}
            <IncomingCall
                isOpen={callState === 'ringing' && incomingCall !== null}
                callerName={incomingCall?.callerName}
                onAccept={async () => {
                    acceptCall();
                    // TODO: Connect to LiveKit room using incomingCall.roomName
                    const data = await getUserData();
                    await joinLiveKitRoom(incomingCall.roomName, data.username);
                        console.log(`Joining room: ${incomingCall.roomName}`);
                }}
                onDeny={() => {
                    rejectCall();
                    console.log("Call denied.");
                }}
            />

            {/* Toast Notification */}
            <ToastNotification
                isVisible={showToast}
                message={toastMessage}
            />

        </div>
    );
}

export default MediaPage;
