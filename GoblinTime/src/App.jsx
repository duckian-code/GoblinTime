import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Header from "./components/Header";
import Footer from "./components/Footer";

import AuthPage from "./pages/AuthPage";
import ProfilePage from "./pages/ProfilePage";
import MediaPage from "./pages/MediaPage";

import "./components/Layout.css";

function App() {
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
            </div>
        </Router>
    );
}

export default App;