import { NavLink } from "react-router-dom";

const Sidebar = () => {
  const linkClass = ({ isActive }) =>
    "sidebar-option" + (isActive ? " active" : "");

  return (
    <div className="sidebar">
      <div className="sidebar-options">
        <NavLink to="/dashboard" className={linkClass}>
          <span>🏠</span>
          <p>Dashboard</p>
        </NavLink>

        <NavLink to="/pending-orders" className={linkClass}>
          <span>📦</span>
          <p>Pending Orders</p>
        </NavLink>

        <NavLink to="/order-history" className={linkClass}>
          <span>🕒</span>
          <p>Order History</p>
        </NavLink>

        <NavLink to="/profile" className={linkClass}>
          <span>👤</span>
          <p>Profile</p>
        </NavLink>
      </div>
    </div>
  );
};

export default Sidebar;
