import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Header from "./components/Header";
import Footer from "./components/Footer";

import AuthPage from "./pages/AuthPage";
import ProfilePage from "./pages/ProfilePage";
import MediaPage from "./pages/MediaPage";

import "./components/Layout.css";
import IncomingCall from "./components/IncomingCall";
import { useCallContext } from "./context/CallContext";

function App() {
    const { isReceivingCall, setIsReceivingCall, caller } = useCallContext();

    // WHEN ACCEPT BUTTON IS CLICKED
    const handleCallAccept = (callerName) => {
        console.log("Call Accepted!");
        // TODO: CALL ACCEPTED/SIGNALING LOGIC HERE

        setIsReceivingCall(false);
    }

    const handleCallDeny = () => {
        console.log("Call Denied!");
        // TODO: CALL DENIED/SIGNALING LOGIC HERE

        setIsReceivingCall(false);
    }

    return (
        <Router>
            <div className="app-container">
                <Header />

                <main className="main-content">
                    <Routes>
                        <Route path="/" element={<AuthPage />} />
                        <Route path="/profile" element={<ProfilePage />} />
                        <Route path="/media" element={<MediaPage />} />
                    </Routes>
                </main>

                <Footer />

                <IncomingCall
                    isOpen={isReceivingCall}
                    callerName={caller}
                    onAccept={handleCallAccept}
                    onDeny={handleCallDeny}
                />
            </div>
        </Router>
    );
}

export default App;
