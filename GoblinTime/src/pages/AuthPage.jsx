import { useState } from "react";
import {useNavigate} from "react-router-dom";
import { useWebSocket } from "../context/WebSocketContext.jsx";
import logo from "../assets/logo.png";
import { buildUrl } from "../utils/urlHelper.js";

function AuthPage() {
    const { connectWs } = useWebSocket(); // Import the useWebSocket hook
    const [isSignUp, setIsSignUp] = useState(false);

    const [email, setEmail] = useState("");
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
        event.preventDefault(); // prevents default page reload
        setIsLoading(true); // deprecated
        setError(null);


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
        const payload = {
            username,
            password,
            ...(isSignUp && { email }) // only include email if signing up
        };

        const token = getCookie("token");

        try {
            if(isSignUp) { // SIGN UP - POST TO USER SERVICE
                const userUrl = window.__ENV__?.VITE_USER_SERVICE_URL || "";
                const registerEndpoint = window.__ENV__?.VITE_REGISTER_ENDPOINT || "";

                const targetUrl = buildUrl(userUrl, registerEndpoint);
                const response = await fetch(targetUrl, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify(payload),
                });

                if (!response.ok) {
                    throw new Error(`User Service responded swith status: ${response.status}`);
                }

                const data = await response.json();
                console.log("User Service successful POST: ", data);

                navigate(0);
            } else {
                const serviceUrl = window.__ENV__?.VITE_AUTH_SERVICE_URL || "";
                const loginEndpoint = window.__ENV__?.VITE_LOGIN_ENDPOINT || "";

                const targetUrl = buildUrl(serviceUrl, loginEndpoint);
                const response = await fetch(targetUrl, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify(payload),
                });

                if (!response.ok) {
                    throw new Error(`User Service responded swith status: ${response.status}`);
                }

                const data = await response.json();
                console.log("User Service successful POST: ", data);

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

    const getCookie = (name) => {
        const cookie = document.cookie
            .split("; ")
            .find((row) => row.startsWith(`${name}=`));

        return cookie ? decodeURIComponent(cookie.split("=")[1]) : "";
    };

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
