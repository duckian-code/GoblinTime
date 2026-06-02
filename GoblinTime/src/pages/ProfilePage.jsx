import {useEffect, useState} from "react";

function ProfilePage() {
    const [profileData, setProfileData] = useState({
        username: "",
        email: ""
    });
    const [error, setError] = useState(null);
    const [clan, setClan] = useState("");
    const [friend, setFriend] = useState("");

    const contacts = [
    //     "GoblinKing42",
    //     "CaveDweller",
    //     "MossWizard",
    //     "DungeonRat",
    //     "SwampSorcerer"
    ];

    const getCookie = (name) => {
        const cookie = document.cookie
            .split("; ")
            .find((row) => row.startsWith(`${name}=`));

        return cookie ? decodeURIComponent(cookie.split("=")[1]) : "";
    };

    const setCookie = (key, value) => {
        document.cookie = `${key}=${value}; path=/; max-age=3600`;
        console.log("Cookie set:", key, value);
        return true; // True on successful assignment
    }

    const fetchContacts = async(event) => {
        setError(null);

        const endpoint = window.__ENV__?.VITE_CONTACTS_ENDPOINT || "";
        const targetUrl = endpoint;
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

            setError(null);
            return data;
        } catch (err) {
            console.error("Auth Error: ", err);
            setError(err.message || "An error occurred during authentication. Please try again.");
        }
    }

    const profile = async() => {
        setError(null);

        const token = getCookie("token");

        if (!token) {
            setError("Unable to load profile: JWT cookie was not found.");
            return;
        }

        const endpoint = window.__ENV__?.VITE_USER_ENDPOINT || "";
        const targetUrl = endpoint;

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
            setProfileData({
                username: data.username || "",
                email: data.email || "",
                clan: data.clan || ""
            });
            setError(null);
        } catch (err) {
            console.error("Profile Error: ", err);
            setError(err.message || "An error occurred while loading the profile. Please try again.");
        }
    }

    const handleSubmit = async(event) => {
        const endpoint = window.__ENV__?.VITE_USER_ENDPOINT || "";
        const targetUrl = endpoint;

        const payload = {
            clan
        };

        const token = getCookie("token");

        try {
            const response = await fetch(targetUrl, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                throw new Error(`User Service responded with status: ${response.status}`);
            }

            const data = await response.json();
            console.log("User Service successful PATCH: ", data);
            setError(null);
        } catch (err) {
            console.error("Auth Error: ", err);
            setError(err.message || "An error occurred PATCHing goblin. Please try again.");
        }
    }

    const addFriend = async(event) => {
        event.preventDefault();
        const endpoint = window.__ENV__?.VITE_CONTACTS_ENDPOINT || ""

        const payload = {
            friend // friend ID
        }

        const token = getCookie("token");

        try {
            const response = await fetch(endpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                throw new Error(`User Service responded with status: ${response.status}`);
            }

            const data = await response.json();
            console.log("User Service successful POST: ", data);
            setFriend("");
            setError(null);
        } catch (err) {
            console.error("Auth Error: ", err);
            setError(err.message || "An error occurred adding goblin friend. Please try again.");
        }
    }

    // ADD TOKEN AS HEADER BEFORE SENDING TO ENDPOINT
    useEffect(() => {
        profile();
        fetchContacts();
    }, []);

    void fetchContacts;
    void handleSubmit;

    return (
        <div className="page profile-page">

            <section className="profile-info">
                <h2>Profile</h2>

                {error && <p className="profile-error" style={{ color: "red"}}>{error}</p>}

                <p>
                    <strong>Username:</strong> {profileData.username}
                </p>

                <p>
                    <strong>Clan:</strong> {profileData.clan}
                </p>

                <form className="profile-form" onSubmit={handleSubmit}>
                    <input type="text" placeholder="Change Clan Name" onChange={(e) => setClan(e.target.value)} required />
                    <button type="submit">Enlist</button>
                </form>
            </section>

            <section className="add-friend-section">
                <h2>Add Friend</h2>

                <form className="add-friend-form" onSubmit={addFriend}>
                    <input type="text" placeholder="Friend's Username" value={friend} onChange={(e) => setFriend(e.target.value)} required />
                    <button type="submit">Add</button>
                </form>
            </section>

            <section className="contacts-section">
                <h2>Contacts</h2>

                <ul>
                    {contacts.map((contact, index) => (
                        <li key={index}>{contact}</li>
                    ))}
                </ul>
            </section>

        </div>
    );
}

export default ProfilePage;
