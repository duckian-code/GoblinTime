const getRuntimeEnv = () => window.__ENV__ || {};

export const getCookie = (name) => {
    const cookie = document.cookie
        .split("; ")
        .find((row) => row.startsWith(`${name}=`));

    return cookie ? decodeURIComponent(cookie.split("=")[1]) : "";
};

const getEndpoint = (key, fallback) => getRuntimeEnv()[key] || fallback;

const getAuthHeaders = () => {
    const token = getCookie("token");

    return {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
    };
};

const normalizeContact = (contact) => ({
    ...contact,
    id: contact.id ?? contact.ID ?? contact.uuid,
    username: contact.username ?? contact.Username ?? "",
    clan: contact.clan ?? contact.Clan ?? "",
});

const normalizeProfile = (profile) => ({
    ...profile,
    id: profile.id ?? profile.ID ?? profile.uuid,
    username: profile.username ?? profile.Username ?? "",
    email: profile.email ?? profile.Email ?? "",
    clan: profile.clan ?? profile.Clan ?? "",
});

const normalizeContacts = (contacts) => (
    Array.isArray(contacts) ? contacts.map(normalizeContact) : []
);

const readErrorMessage = async (response, fallback) => {
    const message = await response.text();
    return message || fallback;
};

export const fetchContacts = async () => {
    const response = await fetch(getEndpoint("VITE_CONTACTS_ENDPOINT", "/user/contacts"), {
        method: "GET",
        headers: getAuthHeaders(),
    });

    if (!response.ok) {
        throw new Error(await readErrorMessage(response, `Contacts responded with status: ${response.status}`));
    }

    return normalizeContacts(await response.json());
};

export const fetchRecommendedContacts = async () => {
    const response = await fetch(getEndpoint("VITE_RECOMMENDED_ENDPOINT", "/user/contacts/recommendation"), {
        method: "GET",
        headers: getAuthHeaders(),
    });

    if (!response.ok) {
        throw new Error(await readErrorMessage(response, `Recommendations responded with status: ${response.status}`));
    }

    return normalizeContacts(await response.json());
};

export const addContact = async (username) => {
    const response = await fetch(getEndpoint("VITE_CONTACTS_ENDPOINT", "/user/contacts"), {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ friend_username: username }),
    });

    if (!response.ok) {
        throw new Error(await readErrorMessage(response, `Contacts responded with status: ${response.status}`));
    }
};

export const fetchProfile = async () => {
    const response = await fetch(getEndpoint("VITE_USER_ENDPOINT", "/user/profile"), {
        method: "GET",
        headers: getAuthHeaders(),
    });

    if (!response.ok) {
        throw new Error(await readErrorMessage(response, `User profile responded with status: ${response.status}`));
    }

    return normalizeProfile(await response.json());
};

export const updateProfile = async (payload) => {
    const response = await fetch(getEndpoint("VITE_USER_ENDPOINT", "/user/profile"), {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        throw new Error(await readErrorMessage(response, `User profile responded with status: ${response.status}`));
    }
};
