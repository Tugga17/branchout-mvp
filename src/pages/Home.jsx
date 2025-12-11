import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../supabase";

export default function Home() {
  const [profile, setProfile] = useState(null);
  const navigate = useNavigate();

  // Load profile if logged in
  useEffect(() => {
    async function loadUser() {
      const { data } = await supabase.auth.getSession();
      const session = data?.session;

      if (session) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single();

        setProfile(profileData);
      }
    }
    loadUser();
  }, []);

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-green-100 to-green-200 flex flex-col">

      {/* TOP NAV */}
      <nav className="w-full px-6 py-4 flex justify-between items-center">
        <h1 className="text-3xl font-extrabold text-green-800 tracking-tight">
          BranchOut 🌿
        </h1>

        <div className="flex items-center gap-6">

          {!profile && (
            <>
              <Link to="/login" className="text-green-900 font-semibold hover:underline">
                Log In
              </Link>

              <Link
                to="/signup"
                className="bg-green-700 text-white px-4 py-2 rounded-full font-semibold shadow hover:bg-green-800"
              >
                Sign Up
              </Link>
            </>
          )}

          {profile && (
            <button
              onClick={() => navigate("/map")}
              className="bg-green-700 text-white px-4 py-2 rounded-full font-semibold shadow hover:bg-green-800"
            >
              Go to Map
            </button>
          )}

          {/* Admin shortcut */}
          {profile?.role === "admin" && (
            <button
              onClick={() => navigate("/admin")}
              className="bg-blue-600 text-white px-4 py-2 rounded-full font-semibold shadow hover:bg-blue-700"
            >
              Admin
            </button>
          )}
        </div>
      </nav>

      {/* HERO SECTION */}
      <div className="flex flex-col items-center text-center px-6 mt-20">
        <h2 className="text-5xl font-bold text-green-900 max-w-3xl leading-tight drop-shadow-sm">
          Discover the nature around you.
        </h2>

        <p className="text-lg text-green-800 mt-4 max-w-xl leading-relaxed">
          Explore parks, gardens, trails, study spots, and peaceful corners across New Orleans.
          BranchOut helps you connect with the outdoors and find calm in the city.
        </p>

        <Link
          to="/map"
          className="mt-8 bg-green-700 text-white px-8 py-4 rounded-full shadow-xl text-xl font-semibold hover:bg-green-800 transition"
        >
          Explore the Map 🌎
        </Link>
      </div>

      {/* FEATURE SECTION */}
      <div className="mt-24 flex flex-col items-center px-6 pb-20">
        <h3 className="text-3xl font-bold text-green-900 mb-10">What You Can Do</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl">

          <FeatureCard
            title="Find Nature Spots"
            text="Discover peaceful and vibrant natural spaces across the city."
            icon="🌱"
          />

          <FeatureCard
            title="Share Your Favorites"
            text="Add parks, gardens, study spots, and more for the community."
            icon="📍"
          />

          <FeatureCard
            title="See Local Events"
            text="Organizations can post limited-time events for everyone to enjoy."
            icon="📆"
          />
        </div>
      </div>

    </div>
  );
}

function FeatureCard({ title, text, icon }) {
  return (
    <div className="bg-white/80 backdrop-blur-lg border border-green-200 rounded-2xl shadow-lg p-6 flex flex-col items-center text-center">
      <div className="text-5xl mb-4">{icon}</div>
      <h4 className="text-xl font-semibold text-green-900 mb-2">{title}</h4>
      <p className="text-green-700">{text}</p>
    </div>
  );
}
