import Sidebar from "./Sidebar";
import Header from "./Header";
import { useAuth } from "../context/AuthContext";

const DashboardLayout = ({ children }) => {
  const { shelter } = useAuth();

  return (
    <>
      <Sidebar />
      <Header shelter={shelter} />
      <div className="main">{children}</div>
    </>
  );
};

export default DashboardLayout;
