import { useState } from "react";

function AuthPage() {
    const [isSignUp, setIsSignUp] = useState(false);

    const [email, setEmail] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    // State to handle loading and errors
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const toggleAuthMode = () => {
        setIsSignUp((currentMode) => !currentMode);
        setError(null);
    };

    const handleSubmit = async(event) => {
        event.preventDefault(); // prevents default page reload
        setIsLoading(true); // deprecated
        setError(null);

        const serviceUrl = process.env.USER_SERVICE_URL || "";
        const endpoint = process.env.USER_ENDPOINT || ""
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

        // TODO: IF SERVICE URL INCLUDES SLASH, REMOVE IT HERE
        const targetUrl = `${serviceUrl}/${endpoint}`;

        const payload = {
            username,
            password,
            ...(isSignUp && { email }) // only include email if signing up
        };

        try {
            const response = await fetch(targetUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                throw new Error(`User Service responded swith status: ${response.status}`);
            }

            const data = await response.json();

            if (!isSignUp) {
                // TODO: VALIDATE ON ALL PAGES IF TOKEN IS RIGHT
                storeLoginSession(data);
            }

            console.log("User Service successful POST: ", data);
        } catch (err) {
            console.error("Auth Error: ", err);
            setError(err.message || "An error occurred during authentication. Please try again.");
        } finally {
            setIsLoading(false);
        }
    }

    const storeLoginSession = ({ session_token, expires_at }) => {
        if (!session_token || !expires_at) {
            throw new Error("Session token or expiration missing from response.");
        }

        const expiresAt = new Date(expires_at);

        if (Number.isNaN(expiresAt.getTime())) {
            throw new Error("Invalid expiration date from response.");
        }

        setCookie("session_token", session_token, expiresAt);
        setCookie("session_expires_at", expires_at, expiresAt);

        // TODO: CHECK ON ALL PAGES (ON HEADER? IF SESSIONS EXPIRED, IF YES CLEAR COOKIE AND REDIRECT HERE
    };

    const setCookie = (key, value, expiresAt) => {
        document.cookie = [
            `${encodeURIComponent(key)}=${encodeURIComponent(value)}`,
            "path=/",
            `expires=${expiresAt.toUTCString()}`,
            "SameSite=Lax",
        ].join("; ");
    }

    return (
        <div className="page auth-page">
            <div className="auth-container">

                <section className="auth-section">
                    <div id={"auth-header"}>
                        <img src="src/assets/logo.png" alt="Goblin Logo" />
                        <h2>{isSignUp ? "Sign Up" : "Login"}</h2>
                    </div>

                    {error && <p className="auth-error" style={{ color: "red"}}>{error}</p>}

                    <form className="auth-form" onSubmit={handleSubmit}>
                        {isSignUp && (
                            <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required/>
                        )}
                        <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} required/>
                        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required/>

                        <button type="submit" disabled={isLoading}>
                            {isSignUp ? "Create Account" : "Login"}
                        </button>
                    </form>

                    <p className="auth-switch-text">
                        {isSignUp ? "Already have an account?" : "Need an account?"}
                    </p>
                    <button
                        type="button"
                        className="auth-switch-button"
                        onClick={toggleAuthMode}
                    >
                        {isSignUp ? "Back to Login" : "Create an Account"}
                    </button>
                </section>

            </div>
        </div>
    );
}

export default AuthPage;
