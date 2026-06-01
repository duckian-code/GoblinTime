import { useState } from "react";
import {useNavigate} from "react-router-dom";
import { useWebSocket } from "../context/WebSocketContext.jsx";
import logo from "../assets/logo.png";

function AuthPage() {
    const { connectWs } = useWebSocket(); // Import the useWebSocket hook
    const [isSignUp, setIsSignUp] = useState(false);

    const [email, setEmail] = useState("");
    const [clan, setClan] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    // State to handle loading and errors
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const navigate = useNavigate();

    const toggleAuthMode = () => {
        setIsSignUp((currentMode) => !currentMode);
        setError(null);
    };

    const handleSubmit = async(event) => {
        console.log("Auth Page Handle Submit");
        event.preventDefault(); // prevents default page reload
        setIsLoading(true); // deprecated
        setError(null);

        const setCookie = (key, value) => {
            document.cookie = `${key}=${value}; path=/; max-age=3600`;
            console.log("Cookie set:", key, value);
            return true; // True on successful assignment
        }

        // TODO: IF SERVICE URL INCLUDES SLASH, REMOVE IT HERE
        const payload = {
            username,
            password,
            ...(isSignUp && { email, clan }) // only include email & clan if signing up
        };

        console.log("Payload Being Sent to Frontend: ", JSON.stringify(payload));


        try {
            if(isSignUp) { // SIGN UP - POST TO USER SERVICE
                const registerEndpoint = window.__ENV__?.VITE_REGISTER_ENDPOINT || "";

                const response = await fetch(registerEndpoint, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        // "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify(payload),
                });

                if (!response.ok) {
                    throw new Error(`User Service responded swith status: ${response.status}`);
                }

                // const data = await response.json();
                console.log("User Service successful POST");

                navigate(0);
            } else {
                const loginEndpoint = window.__ENV__?.VITE_LOGIN_ENDPOINT || "";

                const response = await fetch(loginEndpoint, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        // "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify(payload),
                });

                if (!response.ok) {
                    throw new Error(`User Service responded swith status: ${response.status}`);
                }

                const data = await response.json();
                console.log("User Service successful POST");

                setCookie("token", data.token);

                navigate("/profile");
            }
        } catch (err) {
            console.error("Auth Error: ", err);
            setError(err.message || "An error occurred during authentication. Please try again.");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="page auth-page">
            <div className="auth-container">

                <section className="auth-section">
                    <div id={"auth-header"}>
                        <img src={logo} alt="Goblin Logo" />
                        <h2>{isSignUp ? "Sign Up" : "Login"}</h2>
                    </div>

                    {error && <p className="auth-error" style={{ color: "red"}}>{error}</p>}

                    <form className="auth-form" onSubmit={handleSubmit}>
                        {isSignUp && (
                            <>
                                <input
                                    type="email"
                                    placeholder="Email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />

                                <input
                                    type="text"
                                    placeholder="Clan"
                                    value={clan}
                                    onChange={(e) => setClan(e.target.value)}
                                    required
                                />
                            </>
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
