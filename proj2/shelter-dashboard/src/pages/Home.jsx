import DashboardLayout from "../components/DashboardLayout";

const Home = () => {
  return (
    <DashboardLayout>
      <h2>Welcome to your Shelter Dashboard</h2>

      <div className="card" style={{ marginTop: "20px" }}>
        <p>Monitor orders, update profile details, and track donation activity.</p>
      </div>
    </DashboardLayout>
  );
};

export default Home;
