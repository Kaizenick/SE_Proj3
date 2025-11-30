import { Navigate } from "react-router-dom";
import { useContext } from "react";
import { StoreContext } from "../Context/StoreContext";

const ProtectedRoute = ({ children }) => {
  const { token } = useContext(StoreContext);

  if (!token) {
    return <Navigate to="/driver/register" replace />;
  }

  return children;
};

export default ProtectedRoute;
