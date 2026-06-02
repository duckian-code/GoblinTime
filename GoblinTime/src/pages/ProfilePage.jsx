import {useEffect, useState} from "react";
import ContactList from "../components/ContactList.jsx";
import {
    addContact,
    fetchContacts,
    fetchProfile,
    updateProfile,
} from "../utils/contactApi.js";

function ProfilePage() {
    const [profileData, setProfileData] = useState({
        username: "",
        email: "",
        clan: "",
    });
    const [error, setError] = useState(null);
    const [contacts, setContacts] = useState([]);
    const [clan, setClan] = useState("");
    const [friend, setFriend] = useState("");

    const loadContacts = async () => {
        setError(null);

        try {
            const data = await fetchContacts();
            setContacts(data);
        } catch (err) {
            console.error("Contacts Error: ", err);
            setError(err.message || "An error occurred while loading contacts. Please try again.");
        }
    };

    const loadProfile = async() => {
        setError(null);

        try {
            const data = await fetchProfile();
            setProfileData({
                username: data.username || "",
                email: data.email || "",
                clan: data.clan || "",
            });
            setError(null);
        } catch (err) {
            console.error("Profile Error: ", err);
            setError(err.message || "An error occurred while loading the profile. Please try again.");
        }
    };

    const handleSubmit = async(event) => {
        event.preventDefault();
        setError(null);

        const trimmedClan = clan.trim();

        const payload = {
            clan: trimmedClan,
        };

        try {
            await updateProfile(payload);
            setProfileData((currentProfile) => ({
                ...currentProfile,
                clan: trimmedClan,
            }));
            setClan("");
            setError(null);
        } catch (err) {
            console.error("Profile Update Error: ", err);
            setError(err.message || "An error occurred PATCHing goblin. Please try again.");
        }
    };

    const addFriend = async(event) => {
        event.preventDefault();
        setError(null);

        try {
            await addContact(friend.trim());
            await loadContacts();
            setFriend("");
            setError(null);
        } catch (err) {
            console.error("Contact Add Error: ", err);
            setError(err.message || "An error occurred adding goblin friend. Please try again.");
        }
    };

    useEffect(() => {
        loadProfile();
        loadContacts();
    }, []);

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
                    <input
                        type="text"
                        placeholder="Change Clan Name"
                        value={clan}
                        onChange={(e) => setClan(e.target.value)}
                        required
                    />
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

            <ContactList
                title="Contacts"
                contacts={contacts}
                emptyMessage="No contacts yet."
            />

        </div>
    );
}

export default ProfilePage;
