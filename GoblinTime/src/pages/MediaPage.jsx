import {useState} from "react";

function MediaPage() {
    const livekit = require('livekit-client');
    const room = new livekit.Room();


    const contacts = [
        // "Anonymous Goblin",
        // "Less Anonymous Goblin",
        // "Super Anonymous Goblin"
    ];

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

        const serviceUrl = process.env.USER_SERVICE_URL || "";
        const endpoint = process.env.CONTACTS_ENDPOINT || ""
        // TODO: IF SERVICE URL INCLUDES SLASH, REMOVE IT HERE
        const targetUrl = `${serviceUrl}/${endpoint}`;

        try {
            const response = await fetch(targetUrl, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json"
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

    const fetchRecommended = async(event) => {
        setError(null);

        const serviceUrl = process.env.USER_SERVICE_URL || "";
        const endpoint = process.env.RECOMMENDED_ENDPOINT || ""
        // TODO: IF SERVICE URL INCLUDES SLASH, REMOVE IT HERE
        const targetUrl = `${serviceUrl}/${endpoint}`;

        try {
            const response = await fetch(targetUrl, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json"
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