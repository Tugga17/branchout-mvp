import { useState } from "react";
import { supabase } from "../supabase";
import { useNavigate } from "react-router-dom";

export default function Signup() {
  const navigate = useNavigate();
  const [mode, setMode] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignup(e) {
    e.preventDefault();
    setLoading(true);

    // Create account
    const { data, error } = await supabase.auth.signUp({
      email,
      password
    });

    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }

    // Fix: Supabase returns session.user, not user
    const user = data.session?.user;

    if (!user) {
      alert("Signup succeeded, but Supabase did not return a user. Cannot create profile.");
      console.log("FULL SIGNUP RESPONSE:", data);
      setLoading(false);
      return;
    }

    // Fix: Use UPSERT and include email
    await supabase.from("profiles").upsert({
      id: user.id,
      email: email,
      role: mode === "org" ? "pending_org" : "user"
    });

    // Redirect
    if (mode === "org") {
      navigate("/pending-review");
    } else {
      navigate("/map");
    }

    setLoading(false);
  }

  if (!mode) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-green-100 p-6">
        <h1 className="text-3xl font-bold mb-6">Choose account type</h1>

        <button
          onClick={() => setMode("user")}
          className="bg-white border border-green-700 text-green-800 w-64 py-3 rounded-lg text-xl mb-4"
        >
          Regular User
        </button>

        <button
          onClick={() => setMode("org")}
          className="bg-green-700 text-white w-64 py-3 rounded-lg text-xl"
        >
          Organization
        </button>
      </div>
    );
  }

  return (
    <div className="h-screen flex items-center justify-center bg-green-100">
      <form
        onSubmit={handleSignup}
        className="bg-white p-6 rounded-lg shadow-lg w-80 space-y-4"
      >
        <h2 className="text-2xl font-bold text-center">
          {mode === "org" ? "Organization Signup" : "User Signup"}
        </h2>

        <input
          className="w-full border p-2 rounded"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          className="w-full border p-2 rounded"
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          className="w-full bg-green-600 text-white py-2 rounded font-bold"
          disabled={loading}
        >
          {loading ? "Creating account..." : "Sign Up"}
        </button>

        <button
          type="button"
          className="w-full text-gray-600 underline"
          onClick={() => setMode(null)}
        >
          Back
        </button>
      </form>
    </div>
  );
}
