// MapPage.jsx
import { useEffect, useState } from "react";
import MapView from "../components/MapView";
import AddPlaceModal from "../components/AddPlaceModal";
import AddEventModal from "../components/AddEventModal";
import { supabase } from "../supabase";

export default function MapPage() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);

  const [showPlaceModal, setShowPlaceModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(false);

  function refreshMap() {
    setRefreshTrigger((prev) => !prev);
  }

  /* ---------------- LOAD AUTH + PROFILE ---------------- */
  useEffect(() => {
    async function loadAuth() {
      const { data } = await supabase.auth.getSession();
      const currentSession = data?.session;
      setSession(currentSession);

      if (currentSession) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", currentSession.user.id)
          .single();

        setProfile(profileData);
      }
    }

    loadAuth();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession);
        if (!newSession) setProfile(null);
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  /* ---------------- NOT LOGGED IN ---------------- */
  if (!session) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-green-50">
        <h1 className="text-3xl font-bold text-green-800 mb-4">
          Welcome to BranchOut
        </h1>

        <p className="text-gray-700 mb-8 text-center max-w-md">
          Discover green spaces and community events.
          Log in or create an account to get started.
        </p>

        <div className="flex gap-4">
          <button
            onClick={() => (window.location.href = "/login")}
            className="bg-green-600 text-white px-6 py-3 rounded-lg shadow font-semibold"
          >
            Log In
          </button>

          <button
            onClick={() => (window.location.href = "/signup")}
            className="bg-white border border-green-600 text-green-700 px-6 py-3 rounded-lg shadow font-semibold"
          >
            Sign Up
          </button>
        </div>
      </div>
    );
  }

  /* ---------------- WAIT FOR PROFILE ---------------- */
  if (!profile) {
    return (
      <div className="h-screen flex items-center justify-center bg-green-50">
        <p className="text-green-700 font-semibold">Loading profile…</p>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen relative">

      {/* ⚠️ PENDING ORG BANNER */}
      {profile.role === "pending_org" && (
        <div className="absolute top-0 left-0 w-full bg-yellow-100 border-b border-yellow-300 text-yellow-800 text-center py-2 z-[9998]">
          Your organization is awaiting admin approval. You can explore the map, but cannot post yet.
        </div>
      )}

      {/* PROFILE MENU */}
      <ProfileMenu profile={profile} />

      {/* MAP — ALWAYS RENDERS FOR LOGGED-IN USERS */}
      <MapView refreshTrigger={refreshTrigger} profile={profile} />

      {/* ➕ ADD PLACE (users + approved orgs) */}
      <button
        onClick={() => {
          if (profile.role === "pending_org") {
            alert("Your organization is awaiting admin approval.");
            return;
          }
          setShowPlaceModal(true);
        }}
        className="absolute bottom-6 right-6 bg-green-600 text-white px-5 py-3 rounded-full shadow-lg font-bold z-[9999]"
      >
        + Add Place
      </button>

      {/* ➕ ADD EVENT (approved orgs only) */}
      {profile.role === "approved_org" && (
        <button
          onClick={() => setShowEventModal(true)}
          className="absolute bottom-24 right-6 bg-blue-600 text-white px-5 py-3 rounded-full shadow-lg font-bold z-[9999]"
        >
          + Add Event
        </button>
      )}

      {/* PLACE MODAL */}
      {showPlaceModal && (
        <AddPlaceModal
          onClose={() => setShowPlaceModal(false)}
          onAdded={refreshMap}
          profile={profile}
        />
      )}

      {/* EVENT MODAL */}
      {showEventModal && (
        <AddEventModal
          orgId={profile.id}
          onClose={() => setShowEventModal(false)}
          onAdded={refreshMap}
        />
      )}
    </div>
  );
}

/* ---------------- PROFILE MENU ---------------- */

function ProfileMenu({ profile }) {
  const [open, setOpen] = useState(false);

  async function handleSignOut() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  return (
    <div className="absolute top-4 right-4 z-[9999]">
      <button
        onClick={() => setOpen(!open)}
        className="bg-white shadow px-4 py-2 rounded-full border font-semibold"
      >
        {profile.email?.split("@")[0]}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-52 bg-white border rounded-lg shadow-xl p-3">
          <p className="text-sm font-semibold">{profile.email}</p>
          <p className="text-xs text-gray-500 mb-3">
            Role: {profile.role}
          </p>

          {profile.role === "admin" && (
            <button
              onClick={() => (window.location.href = "/admin")}
              className="bg-blue-600 text-white py-1 px-3 rounded w-full mb-2"
            >
              Admin Panel
            </button>
          )}

          <button
            onClick={handleSignOut}
            className="bg-red-600 text-white py-1 px-3 rounded w-full"
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
