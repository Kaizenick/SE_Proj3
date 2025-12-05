import React, { useContext, useEffect, useState } from "react";
import "./Profile.css";
import axios from "axios";
import { toast } from "react-toastify";
import { StoreContext } from "../../Context/StoreContext";

const ProfilePreferences = () => {
  const { url, token } = useContext(StoreContext);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [diet, setDiet] = useState("any");
  const [sugar, setSugar] = useState("any");

  // ------- LOAD PROFILE ONCE -------
  useEffect(() => {
    const fetchProfile = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await axios.post(
          `${url}/api/user/profile`,
          {}, // POST body (empty)
          { headers: { token } } // 🔐 send token header
        );

        if (!res.data.success) {
          console.error("Profile load error:", res.data.message);
          toast.error(res.data.message || "Failed to load profile");
          return;
        }

        const user = res.data.data;
        setName(user.name || "");
        setDiet(user.dietPreference || "any");
        setSugar(user.sugarPreference || "any");
      } catch (err) {
        console.error("fetchProfile error:", err);
        toast.error("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [token, url]);

  // ------- SAVE PREFERENCES -------
  const handleSave = async (e) => {
    e.preventDefault();
    if (!token) {
      toast.error("Please log in again");
      return;
    }

    setSaving(true);
    try {
      const res = await axios.post(
        `${url}/api/user/preferences`,
        {
          dietPreference: diet,
          sugarPreference: sugar,
        },
        { headers: { token } }
      );

      if (!res.data.success) {
        toast.error(res.data.message || "Failed to update preferences");
      } else {
        toast.success("Preferences updated");
      }
    } catch (err) {
      console.error("savePreferences error:", err);
      toast.error("Failed to update preferences");
    } finally {
      setSaving(false);
    }
  };

  // ------- RENDER -------
  if (!token) {
    return (
      <div className="profile-page">
        <h2>Profile</h2>
        <p>Please sign in to view your profile.</p>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <h2>My Profile</h2>

      <form className="profile-card" onSubmit={handleSave}>
        <div className="profile-row">
          <label>Name</label>
          <input type="text" value={name} disabled />
        </div>

        <div className="profile-row">
          <label>Diet preference</label>
          <select
            value={diet}
            onChange={(e) => setDiet(e.target.value)}
            disabled={loading}
          >
            <option value="any">No diet preference</option>
            <option value="veg-only">Vegetarian only</option>
          </select>
        </div>

        <div className="profile-row">
          <label>Sugar preference</label>
          <select
            value={sugar}
            onChange={(e) => setSugar(e.target.value)}
            disabled={loading}
          >
            <option value="any">Okay with sweets / desserts</option>
            <option value="no-sweets">
              Avoid sweets / desserts (sugar-free)
            </option>
          </select>
        </div>

        <button type="submit" disabled={saving || loading}>
          {saving ? "Saving..." : "Save preferences"}
        </button>
      </form>
    </div>
  );
};

export default ProfilePreferences;
