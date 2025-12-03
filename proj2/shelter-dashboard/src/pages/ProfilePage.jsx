import { useAuth } from "../context/AuthContext";

export default function ProfilePage() {
  const { shelter } = useAuth();

  // Format address if it exists
  const formattedAddress = shelter?.address
    ? `${shelter.address.street || ""}, ${shelter.address.city || ""}, ${
        shelter.address.state || ""
      } ${shelter.address.zipcode || ""}, ${shelter.address.country || ""}`
    : "—";

  return (
    <>
      <h2 className="page-title">Profile</h2>

      <div className="admin-table-container" style={{ padding: "24px" }}>
        <div style={{ display: "grid", rowGap: "14px" }}>
          <div>
            <strong>Name:</strong> {shelter?.name || "—"}
          </div>

          <div>
            <strong>Email:</strong> {shelter?.email || "—"}
          </div>

          <div>
            <strong>Phone:</strong> {shelter?.phone || "—"}
          </div>

          <div>
            <strong>Capacity:</strong> {shelter?.capacity || "—"}
          </div>

          <div>
            <strong>Address:</strong> {formattedAddress}
          </div>
        </div>
      </div>
    </>
  );
}
