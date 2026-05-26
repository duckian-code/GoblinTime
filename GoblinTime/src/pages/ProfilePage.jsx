import {useEffect, useState} from "react";

function ProfilePage() {
    const [profileData, setProfileData] = useState({
        username: "",
        email: ""
    });
    const [error, setError] = useState(null);

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

    const profile = async() => {
        setError(null);

        const userId = getCookie("UUID");

        if (!userId) {
            setError("Unable to load profile: UUID cookie was not found.");
            return;
        }

        const serviceUrl = process.env.USER_SERVICE_URL || "";
        const endpoint = process.env.USER_ENDPOINT || ""
        // TODO: IF SERVICE URL INCLUDES SLASH, REMOVE IT HERE
        const targetUrl = `${serviceUrl}/${endpoint}/${userId}`;

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
            setProfileData({
                username: data.username || "",
                email: data.email || ""
            });
        } catch (err) {
            console.error("Profile Error: ", err);
            setError(err.message || "An error occurred while loading the profile. Please try again.");
        }
    }

    useEffect(() => {
        profile();
    }, []);

    void fetchContacts;

    return (
        <div className="page profile-page">

            <section className="profile-info">
                <h2>Profile</h2>

                {error && <p className="profile-error" style={{ color: "red"}}>{error}</p>}

                <p>
                    <strong>Username:</strong> {profileData.username}
                </p>

                <p>
                    <strong>Email:</strong> {profileData.email}
                </p>
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
