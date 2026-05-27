import {useState} from "react";
import { Room } from "livekit-client";
import { useCallContext } from "../context/CallContext.jsx";

function MediaPage() {
    const room = new Room();

    const [currentRoom, setCurrentRoom] = useState(null);
    const [connected, setConnected] = useState(false);
    const [participants, setParticipants] = useState([]);
    const [localTracks, setLocalTracks] = useState([]);

    const contacts = [
        // "Anonymous Goblin",
        // "Less Anonymous Goblin",
        // "Super Anonymous Goblin"
    ];

    // CALL GLOBAL STATE
    const { setIsReceivingCall, setCaller } = useCallContext();

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
        // "Gilbert",
        // "Godfrey",
        // "Gillard"
    ];

    const fetchContacts = async(event) => {
        setError(null);
        // TODO: contacts endpoint

        const serviceUrl = import.meta.env.VITE_USER_SERVICE_URL || "";
        const endpoint = import.meta.env.VITE_CONTACTS_ENDPOINT || ""
        // TODO: IF SERVICE URL INCLUDES SLASH, REMOVE IT HERE
        const targetUrl = `${serviceUrl}/${endpoint}/`;
        const token = getCookie("token");

        try {
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
            console.log("User Service successful GET: ", data);

            return data;

        } catch (err) {
            console.error("Auth Error: ", err);
            setError(err.message || "An error occurred during authentication. Please try again.");
        }
    }

    const createRoom = async(event) => {
        setError(null);
        const serviceUrl = import.meta.env.VITE_LIVEKIT_SERVICE_URL || "";
    }

    const fetchRecommended = async(event) => {
        setError(null);

        const serviceUrl = import.meta.env.VITE_USER_SERVICE_URL || "";
        const endpoint = import.meta.env.VITE_RECOMMENDED_ENDPOINT || ""
        // TODO: IF SERVICE URL INCLUDES SLASH, REMOVE IT HERE
        const targetUrl = `${serviceUrl}/${endpoint}/`;
        const token = getCookie("token");

        try {
            const response = await fetch(targetUrl, {
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

                    <ul>
                        {contacts.map((contact, index) => (
                            <li key={index}>{contact}</li>
                        ))}
                    </ul>
                </section>

                <section>
                    <h3>Recommended</h3>

                    <ul>
                        {recommended.map((item, index) => (
                            <li key={index}>{item}</li>
                        ))}
                    </ul>
                </section>

            </aside>

            <section className="media-content">
                <div className="media-box">
                    <p>Media / Video Area</p>
                </div>
            </section>

        </div>
    );
}

export default MediaPage;
