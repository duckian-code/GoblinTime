import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { CallProvider } from "./context/CallContext";
import { WebSocketProvider } from "./context/WebSocketContext.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
        <CallProvider>
            <WebSocketProvider>
                <App />
            </WebSocketProvider>
        </CallProvider>
    </React.StrictMode>
);