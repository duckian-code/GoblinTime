function MediaPage() {
    // TODO: IMPLEMENT ENDPOINT CONTACT AND RECOMMENDED
    const contacts = [
        "Anonymous Goblin",
        "Less Anonymous Goblin",
        "Super Anonymous Goblin"
    ];

    const recommended = [
        "Gilbert",
        "Godfrey",
        "Gillard"
    ];

    return (
        <div className="media-layout">

            <aside className="sidebar">

                <section>
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