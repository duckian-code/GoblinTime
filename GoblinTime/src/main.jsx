import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { CallProvider } from "./context/CallContext";

ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
        <CallProvider>
            <App />
        </CallProvider>
    </React.StrictMode>
);