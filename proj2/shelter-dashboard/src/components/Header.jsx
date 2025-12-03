import { useAuth } from "../context/AuthContext";

export default function Header() {
  const { shelter, logout } = useAuth();

  return (
    <header className="header">
      <div style={{ fontWeight: 600 }}>
        {shelter?.name || "Shelter Dashboard"}
      </div>

      <button className="btn" onClick={logout}>Logout</button>
    </header>
  );
}
