import "./Navbar.css";
import { useAuth } from "../context/AuthContext";

const Navbar = () => {
  const { shelter, logout } = useAuth();

  return (
    <div className="navbar">
      <div className="navbar-left">
        <img className="logo" src="/logo.png" alt="ByteBite" />
        {shelter && (
          <span className="navbar-shelter">
            {shelter.name}
          </span>
        )}
      </div>

      <div className="navbar-right">
        <button className="navbar-logout" onClick={logout}>
          Logout
        </button>
      </div>
    </div>
  );
};

export default Navbar;
