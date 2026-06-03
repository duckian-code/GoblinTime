function ContactList({
    title,
    contacts,
    emptyMessage,
    actionLabel,
    onContactClick,
}) {
    return (
        <section className="contact-list-section">
            <h3>{title}</h3>

            {contacts.length === 0 ? (
                <p className="empty-list-message">{emptyMessage}</p>
            ) : (
                <ul className="contact-list" style={{ listStyle: 'none', padding: 0 }}>
                    {contacts.map((contact) => {

                        const currentName = contact.Username || contact.username || "Unknown";
                        const currentClan = contact.Clan || contact.clan;

                        return (
                            <li key={contact.ID || contact.id || currentName} style={{ marginBottom: '8px' }}>
                                <button
                                    type="button"
                                    className="contact-list-button"
                                    onClick={() => onContactClick?.(contact)}
                                    disabled={!onContactClick}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px',
                                        width: '100%',
                                        textAlign: 'left',
                                        padding: '8px 12px'
                                    }}
                                >
                                    {actionLabel && <span className="action-badge">{actionLabel}</span>}
                                    <span style={{ fontWeight: '500' }}>{currentName}</span>


                                    {currentClan && (
                                        <span style={{ opacity: 0.6, fontSize: '0.8rem', marginLeft: 'auto' }}>
                                            [{currentClan}]
                                        </span>
                                    )}
                                </button>
                            </li>
                        );
                    })}
                </ul>
            )}
        </section>
    );
}

export default ContactList;
