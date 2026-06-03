import {useEffect, useRef, useState} from "react";
import { Room } from "livekit-client";
import { useCallContext } from "../context/CallContext.jsx";
import ContactList from "../components/ContactList.jsx";
import ToastNotification from "../components/ToastNotification.jsx";
import OutgoingCall from "../components/OutgoingCall.jsx";
import IncomingCall from "../components/IncomingCall.jsx";
import { useWebSocket } from "../context/WebSocketContext.jsx";
import { LiveKitRoom, VideoConference } from "@livekit/components-react";
import "@livekit/components-styles"; // Required for VideoConference UI
import {
    addContact,
    fetchContacts,
    fetchProfile,
    fetchRecommendedContacts,
} from "../utils/contactApi.js";

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
        connectWs,
        callState, incomingCall, initiateCall, cancelCall, acceptCall, rejectCall, endCall
    } = useWebSocket();

    // caller side - listen for acceptance to join LiveKit
    useEffect(() => {
        const connectCaller = async () => {
            // If we are calling, and the state changes to accepted, and we aren't in a room yet
            if (isCalling && callState === 'accepted' && !lkRoom) {
                const data = await getUserData();
                await joinLiveKitRoom(roomName.current, data?.Username || data?.username);
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

    const [contacts, setContacts] = useState([]);
    const [recommended, setRecommended] = useState([]);

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

    const getUserData = async() => {
        setError(null);
        try {
            const data = await fetchProfile();
            setError(null);
            return data;
        } catch (err) {
            console.error("Profile Error: ", err);
            setError(err.message || "An error occurred while loading the profile. Please try again.");
        }
    };

    const roomName = useRef("");

    // CLICK HANDLERS
    const handleContactClick = async (contact) => {
        const targetUsername = contact.Username || contact.username;
        setCallTarget(targetUsername);
        setIsCalling(true);
        console.log(`Initiating call to ${targetUsername}...`);

        const data = await getUserData();
        if (!data) {
            console.error("Could not fetch user data to initiate call.");
            setIsCalling(false);
            return;
        }

        const currentId = data.ID ?? data.id ?? data.uuid;
        const targetId = contact.ID ?? contact.uuid ?? contact.id;

        roomName.current = `room-${currentId}-${targetId}`;

        initiateCall(targetId, roomName.current, currentId, data.Username || data.username);
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

    const handleAddFriendClick = async (contact) => {
        const username = contact.Username || contact.username || contact;
        setError(null);

        try {
            await addContact(username);
            await loadContacts();
            await loadRecommendedContacts();

            setToastMessage(`${username} Added as Contact`);
            setShowToast(true);

            setTimeout(() => {
                setShowToast(false);
            }, 3000);

        } catch (err) {
            console.error("Error adding friend: ", err);
            setError(err.message || "Could not add user. Please try again.");
        }
    };

    const loadContacts = async() => {
        setError(null);
        try {
            const data = await fetchContacts();
            console.log("User Service successful GET: ", data);
            setContacts(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Contacts Error: ", err);
            setError(err.message || "An error occurred while loading contacts. Please try again.");
        }
    };

    const loadRecommendedContacts = async() => {
        setError(null);
        try {
            setRecommended(await fetchRecommendedContacts());
        } catch (err) {
            console.error("Recommendations Error: ", err);
            setError(err.message || "An error occurred while loading recommendations. Please try again.");
        }
    };

    const createRoom = async(event) => {
        setError(null);
        const serviceUrl = window.__ENV__?.VITE_LIVEKIT_SERVICE_URL || "";
    };

    const fetchRecommended = async() => {
        setError(null);
        const endpoint = window.__ENV__?.VITE_RECOMMENDED_ENDPOINT || "";
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
            setRecommended(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Auth Error: ", err);
            setError(err.message || "An error occurred during authentication. Please try again.");
        }
    };

    // Corrected unclosed dual hook lifecycle scope
    useEffect(() => {
        connectWs();
        loadContacts();
        loadRecommendedContacts();
    }, []);

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
                                key={contact.ID}
                                className="clickable-list-item"
                                onClick={() => handleContactClick({ username: contact.Username, uuid: contact.ID })}
                            >
                                - {contact.Username}
                            </li>
                        ))}
                    </ul>
                </section>

                <section>
                    <h3>Recommended</h3>
                    <ul style={{ listStyleType: 'none', padding: 0 }}>
                        {recommended.map((item) => (
                            <li
                                key={item.ID}
                                className="clickable-list-item"
                                onClick={() => handleAddFriendClick(item.Username)}
                            >
                                + {item.Username}
                            </li>
                        ))}
                    </ul>
                </section>

                {error && <p className="profile-error" style={{ color: "red"}}>{error}</p>}

                <ContactList
                    title="Contacts"
                    contacts={contacts}
                    emptyMessage="No contacts yet."
                    actionLabel="-"
                    onContactClick={handleContactClick}
                />

                <ContactList
                    title="Recommended"
                    contacts={recommended}
                    emptyMessage="No recommendations yet."
                    actionLabel="+"
                    onContactClick={handleAddFriendClick}
                />
            </aside>

            <section className="media-content">
                {lkRoom && lkToken ? (
                    <div style={{ height: '100%', width: '100%' }}>
                        <LiveKitRoom
                            room={lkRoom}
                            token={lkToken}
                            serverUrl={lkUrl}
                            data-lk-theme="default"
                            onDisconnected={() => {
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
                    const data = await getUserData();
                    await joinLiveKitRoom(incomingCall.roomName, data?.Username || data?.username);
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