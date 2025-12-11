// AdminDashboard.jsx
import { useEffect, useState } from "react";
import { supabase } from "../supabase";
import { useNavigate } from "react-router-dom";

export default function AdminDashboard() {
  const [pendingOrgs, setPendingOrgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    checkAdmin();
  }, []);

  async function checkAdmin() {
    const { data: sessionData } = await supabase.auth.getSession();
    const session = sessionData?.session;

    if (!session) {
      navigate("/login");
      return;
    }

    const userId = session.user.id;

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();

    if (error || !profile) {
      alert("Failed to load admin permissions.");
      navigate("/map");
      return;
    }

    if (profile.role !== "admin") {
      alert("You do not have permission to view this page.");
      navigate("/map");
      return;
    }

    loadPendingOrgs();
  }

  async function loadPendingOrgs() {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, email, role, created_at")
      .eq("role", "pending_org");

    if (error) console.error(error);

    setPendingOrgs(data || []);
    setLoading(false);
  }

  async function approveOrg(id) {
    await supabase.from("profiles").update({ role: "org" }).eq("id", id);
    setPendingOrgs(prev => prev.filter(o => o.id !== id));
  }

  async function denyOrg(id) {
    await supabase.from("profiles").update({ role: "user" }).eq("id", id);
    setPendingOrgs(prev => prev.filter(o => o.id !== id));
  }

  if (loading) return <div className="p-8 text-center">Loading admin panel…</div>;

  return (
    <div className="p-8 max-w-3xl mx-auto">

      {/* 🔥 ADDED THIS → Back to Map button */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>

        <button
          onClick={() => navigate("/map")}
          className="bg-green-600 text-white px-4 py-2 rounded-lg shadow hover:bg-green-700"
        >
          ← Back to Map
        </button>
      </div>

      <h2 className="text-xl font-semibold mb-3">Pending Organization Requests</h2>

      {pendingOrgs.length === 0 ? (
        <p className="text-gray-600">No organizations waiting for approval.</p>
      ) : (
        <div className="space-y-4">
          {pendingOrgs.map(org => (
            <div
              key={org.id}
              className="border p-4 rounded-lg shadow-sm flex justify-between items-center"
            >
              <div>
                <p className="font-semibold">{org.email}</p>
                <p className="text-sm text-gray-500">
                  Requested: {new Date(org.created_at).toLocaleString()}
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => approveOrg(org.id)}
                  className="bg-green-600 text-white px-4 py-1 rounded hover:bg-green-700"
                >
                  Approve
                </button>
                <button
                  onClick={() => denyOrg(org.id)}
                  className="bg-red-600 text-white px-4 py-1 rounded hover:bg-red-700"
                >
                  Deny
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
