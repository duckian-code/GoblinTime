import { useEffect, useRef, useState } from "react";
import { Room } from "livekit-client";
import { useCallContext } from "../context/CallContext.jsx";
import ContactList from "../components/ContactList.jsx";
import ToastNotification from "../components/ToastNotification.jsx";
import OutgoingCall from "../components/OutgoingCall.jsx";
import IncomingCall from "../components/IncomingCall.jsx";
import { useWebSocket } from "../context/WebSocketContext.jsx";
import { LiveKitRoom, VideoConference } from "@livekit/components-react";
import "@livekit/components-styles";

// Import fetchContacts from the utility file so data objects are correctly normalized
import { addContact, fetchRecommendedContacts, fetchContacts } from "../utils/contactApi.js";

function MediaPage() {
    const room = new Room();

    // Call Context
    const {
        lkToken, lkUrl, lkRoom, joinLiveKitRoom, leaveLiveKitRoom,
        isCalling, setIsCalling, callTarget, setCallTarget,
        caller, setCaller, isReceivingCall, setIsReceivingCall
    } = useCallContext();

    // WebSocket Context
    const {
        connectWs,
        callState, incomingCall, initiateCall, cancelCall, acceptCall, rejectCall, endCall
    } = useWebSocket();

    const [contacts, setContacts] = useState([]);
    const [recommended, setRecommended] = useState([]);
    const [toastMessage, setToastMessage] = useState("");
    const [showToast, setShowToast] = useState(false);
    const [error, setError] = useState(null);

    const roomName = useRef("");

    // --- LIFECYCLE HOOKS ---

    // Clean initial load: Run once on mount.
    useEffect(() => {
        console.log("[DIAGNOSTIC] MediaPage Component Mounted.");
        connectWs();
        loadContacts();
    }, []);


    // Caller side - listen for acceptance to join LiveKit
    useEffect(() => {
        const connectCaller = async () => {
            if (isCalling && callState === 'accepted' && !lkRoom) {
                const data = await getUserData();
                await joinLiveKitRoom(roomName.current, data?.username || data?.Username);
            }
        };
        connectCaller();
    }, [callState, isCalling, lkRoom]);

    // Handle teardown
    useEffect(() => {
        if (callState === 'idle' && lkRoom) {
            leaveLiveKitRoom();
        }
    }, [callState, lkRoom]);


    // --- DATA FETCHING & HELPERS ---

    const getCookie = (name) => {
        const cookie = document.cookie
            .split("; ")
            .find((row) => row.startsWith(`${name}=`));
        return cookie ? decodeURIComponent(cookie.split("=")[1]) : "";
    };

    const getUserData = async () => {
        setError(null);
        const token = getCookie("token");
        if (!token) {
            setError("Unable to load profile: JWT cookie was not found.");
            return null;
        }

        const endpoint = window.__ENV__?.VITE_USER_ENDPOINT || "";

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
            console.error("Profile Error: ", err);
            setError(err.message || "An error occurred while loading the profile.");
            return null;
        }
    };

    const loadContacts = async () => {
        setError(null);
        try {

            const data = await fetchContacts();


            const validContacts = Array.isArray(data) ? data : [];

            if (validContacts.length > 0) {
                console.log("[DIAGNOSTIC] Inspecting key casing of your first contact record:", {
                    "Keys present": Object.keys(validContacts[0]),
                    "friend.username": validContacts[0].username,
                    "friend.Username": validContacts[0].Username
                });
            } else {
                console.log("[DIAGNOSTIC] Your active contacts list returned completely empty.");
            }

            setContacts(validContacts);

            // Pass the fresh contact records immediately into the recommendation lookup array to avoid asynchronous state delays
            await loadRecommendedContacts(validContacts);
        } catch (err) {
            console.error("Contacts Error: ", err);
            setError(err.message || "An error occurred while loading contacts.");
        }
    };

    const loadRecommendedContacts = async (currentContactsList = contacts) => {
        setError(null);
        try {
            console.log("[DIAGNOSTIC] Step 2: Requesting fetchRecommendedContacts() from API utility...");
            const data = await fetchRecommendedContacts();

            console.log("[DIAGNOSTIC] Step 2 Complete. Raw normalized recommendations payload received:", data);
            console.log("[DIAGNOSTIC] Active contacts list being cross-referenced against:", currentContactsList);

            const cleanRecommendations = Array.isArray(data)
                ? data.filter((rec, index) => {
                    console.log(`\n--- Candidate item index [${index}] evaluation ---`);
                    console.log(`Recommendation candidate keys:`, Object.keys(rec));
                    console.log(`Candidate values -> .username: "${rec.username}", .Username: "${rec.Username}"`);

                    const alreadyFriends = currentContactsList.some((friend, fIndex) => {
                        const matchResult = friend.username === rec.username;
                        console.log(`   -> Comparing with contact [${fIndex}]: friend.username ("${friend.username}") === rec.username ("${rec.username}")? Result: ${matchResult}`);

                        // Fallback logging in case it is capitalized
                        if (!matchResult && (friend.Username || rec.Username)) {
                            console.log(`   -> [ALERT] Capital keys detected: friend.Username is "${friend.Username}", rec.Username is "${rec.Username}"`);
                        }

                        return matchResult;
                    });

                    console.log(`Conclusion for "${rec.username || rec.Username}": Already friends? ${alreadyFriends} -> ${alreadyFriends ? "FILTERED OUT" : "KEEP IN RECOMMENDATIONS"}`);
                    return !alreadyFriends;
                })
                : [];

            console.log("\n[DIAGNOSTIC] Final filtered recommendation array state being sent to UI state:", cleanRecommendations);
            setRecommended(cleanRecommendations);
        } catch (err) {
            console.error("Recommendations Error: ", err);
            setError(err.message || "An error occurred while loading recommendations.");
        }
    };


    // --- CLICK HANDLERS ---

    const handleContactClick = async (contact) => {
        const targetUsername = contact.username || contact.Username;
        setCallTarget(targetUsername);
        setIsCalling(true);

        const data = await getUserData();
        if (!data) {
            console.error("Could not fetch user data to initiate call.");
            setIsCalling(false);
            return;
        }

        const currentId = data.id ?? data.ID ?? data.uuid;
        const targetId = contact.id ?? contact.ID ?? contact.uuid;

        roomName.current = `room-${currentId}-${targetId}`;
        initiateCall(targetId, roomName.current, currentId, data.username || data.Username);
    };

    const handleCancelOutgoingCall = () => {
        if (roomName.current) {
            cancelCall(roomName.current);
        }
        setIsCalling(false);
        setCallTarget("");
    };

    const handleAddFriendClick = async (contact) => {
        const username = contact.username || contact.Username || contact;
        setError(null);

        try {
            await addContact(username);
            await loadContacts();

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

    const simulateIncomingCall = (name) => {
        setCaller(name);
        setIsReceivingCall(true);
    };

    return (
        <div className="media-layout">
            <aside className="sidebar">
                <button onClick={() => simulateIncomingCall("John Goblin")}>Demo Incoming Call</button>

                {error && <p className="profile-error" style={{ color: "red" }}>{error}</p>}

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

            <OutgoingCall
                isOpen={isCalling && callState === 'ringing' && !incomingCall}
                calleeName={callTarget}
                onCancel={handleCancelOutgoingCall}
            />

            <IncomingCall
                isOpen={callState === 'ringing' && incomingCall !== null}
                callerName={incomingCall?.callerName}
                onAccept={async () => {
                    acceptCall();
                    const data = await getUserData();
                    await joinLiveKitRoom(incomingCall.roomName, data?.username || data?.Username);
                    console.log(`Joining room: ${incomingCall.roomName}`);
                }}
                onDeny={() => {
                    rejectCall();
                    console.log("Call denied.");
                }}
            />

            <ToastNotification
                isVisible={showToast}
                message={toastMessage}
            />
        </div>
    );
}

export default MediaPage;