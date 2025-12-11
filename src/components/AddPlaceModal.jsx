import { useState } from "react";
import { supabase } from "../supabase";

export default function AddPlaceModal({ onClose, onAdded }) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [vibes, setVibes] = useState([]);

  const [address, setAddress] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");

  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);

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
     SUBMIT
  --------------------------- */
  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    let finalLat = lat;
    let finalLng = lng;
    let finalAddress = address;

    // If address entered but no coords → geocode
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

    // 📸 Upload photo
    if (photo) {
      const ext = photo.name.split(".").pop();
      const fileName = `${Date.now()}.${ext}`;
      const filePath = `uploads/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("photos")
        .upload(filePath, photo);

      if (uploadError) {
        alert("Photo upload failed: " + uploadError.message);
        setLoading(false);
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from("photos")
        .getPublicUrl(filePath);

      image_url = publicUrlData.publicUrl;
    }

    // 🗄️ Insert
    const { error } = await supabase.from("places").insert({
      title,
      category,
      description,
      vibes,
      lat: finalLat,
      lng: finalLng,
      address: finalAddress,
      image_url,
    });

    if (error) {
      alert("Failed to save place: " + error.message);
      setLoading(false);
      return;
    }

    onAdded();
    onClose();
    setLoading(false);
  }

  const vibeOptions = [
    "Calming",
    "Lively",
    "Photogenic",
    "Shady",
    "Kid-Friendly",
    "Study Spot",
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[99999]">
      <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
        <h2 className="text-xl font-bold mb-4">Add a New Place</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            className="w-full border p-2 rounded"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <input
            className="w-full border p-2 rounded"
            placeholder="Category (e.g., Park)"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
          />

          <textarea
            className="w-full border p-2 rounded"
            placeholder="Short description"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          {/* ADDRESS */}
          <input
            className="w-full border p-2 rounded"
            placeholder="Street address or place name"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />

          {/* VIBES */}
          <div>
            <p className="font-semibold mb-1">Vibes:</p>
            <div className="flex flex-wrap gap-2">
              {vibeOptions.map((v) => (
                <label
                  key={v}
                  className="flex items-center gap-1 border px-2 py-1 rounded cursor-pointer"
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

          <button
            type="button"
            onClick={useMyLocation}
            className="w-full bg-blue-600 text-white py-2 rounded font-bold"
          >
            {locating ? "Detecting..." : "Use My Current Location"}
          </button>

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
            {loading ? "Saving..." : "Add Place"}
          </button>
        </form>

        <button className="mt-3 text-gray-600 underline" onClick={onClose}>
          Cancel
        </button>
      </div>
    </div>
  );
}
