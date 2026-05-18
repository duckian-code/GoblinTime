function ProfilePage() {
    const contacts = [
        "GoblinKing42",
        "CaveDweller",
        "MossWizard",
        "DungeonRat",
        "SwampSorcerer"
    ];

    return (
        <div className="page profile-page">

            <section className="profile-info">
                <h2>Profile</h2>

                <p>
                    <strong>Username:</strong> PlaceholderUser
                </p>

                <p>
                    <strong>Email:</strong> placeholder@email.com
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