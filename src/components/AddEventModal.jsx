import { useState } from "react";
import { supabase } from "../supabase";

export default function AddEventModal({ orgId, onClose, onAdded }) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [vibes, setVibes] = useState([]);

  const [address, setAddress] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");

  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);

  /* ---------------------------
     VIBE OPTIONS
  --------------------------- */
  const vibeOptions = [
    "Community",
    "Relaxed",
    "Lively",
    "Family-Friendly",
    "Educational",
    "Outdoor",
    "Music",
    "Wellness",
  ];

  /* ---------------------------
     GEOCODE ADDRESS → lat/lng
  --------------------------- */
  async function geocodeAddress(addr) {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        addr
      )}`
    );
    const data = await res.json();

    if (!data || data.length === 0) return null;

    return {
      lat: parseFloat(data[0].lat),
      lng: parseFloat(data[0].lon),
      display: data[0].display_name,
    };
  }

  /* ---------------------------
     REVERSE GEOCODE → address
  --------------------------- */
  async function reverseGeocode(lat, lng) {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
    );
    const data = await res.json();
    return data?.display_name || "";
  }

  /* ---------------------------
     USE MY LOCATION
  --------------------------- */
  async function useMyLocation() {
    setLocating(true);

    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      setLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const latitude = pos.coords.latitude;
        const longitude = pos.coords.longitude;

        setLat(latitude);
        setLng(longitude);

        try {
          const addr = await reverseGeocode(latitude, longitude);
          if (addr) setAddress(addr);
        } catch (err) {
          console.error("Reverse geocoding failed:", err);
        }

        setLocating(false);
      },
      () => {
        alert("Unable to get your location.");
        setLocating(false);
      }
    );
  }

  /* ---------------------------
     SUBMIT EVENT
  --------------------------- */
  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    let finalLat = lat;
    let finalLng = lng;
    let finalAddress = address;

    // If address exists but coords don’t → geocode
    if ((!finalLat || !finalLng) && address) {
      const geo = await geocodeAddress(address);
      if (!geo) {
        alert("Could not find that address. Try being more specific.");
        setLoading(false);
        return;
      }
      finalLat = geo.lat;
      finalLng = geo.lng;
      finalAddress = geo.display;
    }

    if (!finalLat || !finalLng) {
      alert("Please enter an address or use your current location.");
      setLoading(false);
      return;
    }

    let image_url = null;

    // 📸 Upload image
    if (photo) {
      const ext = photo.name.split(".").pop();
      const fileName = `${Date.now()}.${ext}`;
      const filePath = `events/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("photos")
        .upload(filePath, photo);

      if (uploadError) {
        alert("Image upload failed: " + uploadError.message);
        setLoading(false);
        return;
      }

      const { data } = supabase.storage
        .from("photos")
        .getPublicUrl(filePath);

      image_url = data.publicUrl;
    }

    // 🗄️ Insert event
    const { error } = await supabase.from("events").insert({
      title,
      category,
      description,
      vibes,              // ✅ array
      lat: finalLat,
      lng: finalLng,
      address: finalAddress,
      start_time: startTime,
      end_time: endTime,
      image_url,
      org_id: orgId,
    });

    if (error) {
      alert("Failed to save event: " + error.message);
      setLoading(false);
      return;
    }

    onAdded();
    onClose();
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[99999]">
      <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
        <h2 className="text-2xl font-bold text-green-900 mb-4">
          Add Event
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">

          <input
            className="w-full border p-2 rounded"
            placeholder="Event title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <input
            className="w-full border p-2 rounded"
            placeholder="Category (e.g. Workshop, Festival)"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />

          <textarea
            className="w-full border p-2 rounded"
            placeholder="Event description"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          {/* ADDRESS */}
          <input
            className="w-full border p-2 rounded"
            placeholder="Street address or venue name"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />

          {/* VIBES */}
          <div>
            <p className="font-semibold mb-1 text-green-900">Vibes</p>
            <div className="flex flex-wrap gap-2">
              {vibeOptions.map((v) => (
                <label
                  key={v}
                  className="flex items-center gap-1 border px-2 py-1 rounded cursor-pointer text-sm"
                >
                  <input
                    type="checkbox"
                    checked={vibes.includes(v)}
                    onChange={(e) =>
                      e.target.checked
                        ? setVibes([...vibes, v])
                        : setVibes(vibes.filter((x) => x !== v))
                    }
                  />
                  {v}
                </label>
              ))}
            </div>
          </div>

          {/* TIME */}
          <div className="flex gap-2">
            <input
              type="datetime-local"
              className="w-1/2 border p-2 rounded"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
            />
            <input
              type="datetime-local"
              className="w-1/2 border p-2 rounded"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              required
            />
          </div>

          {/* USE LOCATION */}
          <button
            type="button"
            onClick={useMyLocation}
            className="w-full bg-blue-600 text-white py-2 rounded font-bold"
          >
            {locating ? "Detecting location…" : "Use My Current Location"}
          </button>

          {/* IMAGE */}
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setPhoto(e.target.files[0])}
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white py-2 rounded font-bold"
          >
            {loading ? "Saving…" : "Add Event"}
          </button>
        </form>

        <button
          className="mt-3 text-gray-600 underline w-full"
          onClick={onClose}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
