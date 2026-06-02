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
                <ul className="contact-list">
                    {contacts.map((contact) => (
                        <li key={contact.id || contact.username}>
                            <button
                                type="button"
                                className="contact-list-button"
                                onClick={() => onContactClick?.(contact)}
                                disabled={!onContactClick}
                            >
                                {actionLabel && <span>{actionLabel}</span>}
                                <span>{contact.username}</span>
                                {contact.clan && <small>{contact.clan}</small>}
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}

export default ContactList;
