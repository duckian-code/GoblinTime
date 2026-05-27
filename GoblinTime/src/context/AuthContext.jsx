import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
    const navigate = useNavigate();

    const [isChecking, setIsChecking] = useState(true);

    const getCookie = (name) => {
        const cookie = document.cookie
            .split("; ")
            .find((row) => row.startsWith(`${name}=`));

        return cookie ? decodeURIComponent(cookie.split("=")[1]) : "";
    };

    useEffect(() => {
        const verifyToken = async () => {
            const token = getCookie("token");
            if (!token) {
                navigate("/");
                return;
            }

            try {
                // TODO: make sure this verifies as expected
                const serviceUrl = window.__ENV__?.VITE_USER_SERVICE_URL || "";
                const endpoint = window.__ENV__?.VITE_USER_ENDPOINT || ""
                const targetUrl = `${serviceUrl}/${endpoint}/`;

                const response = await fetch(targetUrl, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                });

                if (!response.ok || response.status !== 200) {
                    localStorage.removeItem("token");
                    navigate("/");
                } else {
                    setIsChecking(false);
                }
            } catch (error) {
                console.error("Token verification failed:", error);
                navigate("/");
            }
        };

        verifyToken();
    }, [navigate]);

    if (isChecking) {
        return <div>Loading...</div>;
    }

    return children;
};

export default ProtectedRoute;