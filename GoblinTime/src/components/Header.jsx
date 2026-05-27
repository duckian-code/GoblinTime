import { Link } from "react-router-dom";
import logo from "../assets/logo.png";

function Header() {
    return (
        <header className="header">
            <img src={logo} alt="Goblin Logo" />
            <h1>GoblinTime</h1>
            <nav className="nav">
                <Link to="/">Auth</Link>
                <Link to="/profile">Profile</Link>
                <Link to="/media">Media</Link>
            </nav>
        </header>
    );
}

export default Header;