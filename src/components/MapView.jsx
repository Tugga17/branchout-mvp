// MapView.jsx
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { useEffect, useState } from "react";
import { supabase } from "../supabase";

// Fix Leaflet marker icon paths
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: new URL("leaflet/dist/images/marker-icon-2x.png", import.meta.url).href,
  iconUrl: new URL("leaflet/dist/images/marker-icon.png", import.meta.url).href,
  shadowUrl: new URL("leaflet/dist/images/marker-shadow.png", import.meta.url).href,
});

// 🔵 Event marker icon
const eventIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

export default function MapView({ refreshTrigger, onPanelToggle }) {
  const [places, setPlaces] = useState([]);
  const [events, setEvents] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState(null);

  // 🌿 FILTER STATE
  const [showPlaces, setShowPlaces] = useState(true);
  const [showEvents, setShowEvents] = useState(true);
  const [eventTimeFilter, setEventTimeFilter] = useState("all");

  // 📱 MOBILE FILTER VISIBILITY
  const [filtersOpen, setFiltersOpen] = useState(false);

  const panelVisible = Boolean(selectedPlace);

  // 🔁 Notify parent when panel opens/closes
  useEffect(() => {
    onPanelToggle?.(panelVisible);
  }, [panelVisible]);

  useEffect(() => {
    fetchPlaces();
    fetchEvents();
  }, [refreshTrigger]);

  /* ---------------- FETCH PLACES ---------------- */
  async function fetchPlaces() {
    const { data } = await supabase.from("places").select("*");

    const cleaned = (data || []).map((p) => {
      let vibes = [];
      if (Array.isArray(p.vibes)) vibes = p.vibes;
      else if (typeof p.vibes === "string") {
        try { vibes = JSON.parse(p.vibes); } catch {}
      }
      return { ...p, vibes, type: "place" };
    });

    setPlaces(cleaned);
  }

  /* ---------------- FETCH EVENTS ---------------- */
  async function fetchEvents() {
    const { data } = await supabase.from("events").select("*");

    const cleaned = (data || []).map((e) => {
      let vibes = [];
      if (Array.isArray(e.vibes)) vibes = e.vibes;
      else if (typeof e.vibes === "string") {
        try { vibes = JSON.parse(e.vibes); } catch {}
      }
      return { ...e, vibes, type: "event" };
    });

    setEvents(cleaned);
  }

  /* ---------------- EVENT TIME FILTER ---------------- */
  function filterEventsByTime(list) {
    if (eventTimeFilter === "all") return list;

    const now = new Date();

    if (eventTimeFilter === "today") {
      const start = new Date(now.setHours(0, 0, 0, 0));
      const end = new Date(now.setHours(23, 59, 59, 999));
      return list.filter((e) => {
        const d = new Date(e.start_time);
        return d >= start && d <= end;
      });
    }

    if (eventTimeFilter === "week") {
      const end = new Date();
      end.setDate(end.getDate() + 7);
      return list.filter((e) => {
        const d = new Date(e.start_time);
        return d >= new Date() && d <= end;
      });
    }

    return list;
  }

  /* ---------------- DIRECTIONS ---------------- */
  function openDirections(item) {
    const url = /iPhone|iPad|iPod/.test(navigator.userAgent)
      ? `http://maps.apple.com/?daddr=${item.lat},${item.lng}`
      : `https://www.google.com/maps/dir/?api=1&destination=${item.lat},${item.lng}`;

    window.open(url, "_blank");
  }

  return (
    <div className="relative h-full w-full">

      {/* 🏠 BACK HOME */}
      {!panelVisible && (
        <button
          onClick={() => (window.location.href = "/")}
          className="absolute bottom-6 left-6 z-[9999]
                     bg-white/90 px-4 py-2 rounded-full shadow
                     border border-green-300 font-semibold"
        >
          ⬅ Home
        </button>
      )}

      {/* ☰ FILTER TOGGLE (mobile) */}
      {!panelVisible && (
        <button
          onClick={() => setFiltersOpen(!filtersOpen)}
          className="absolute top-4 left-4 z-[9999]
                     bg-white/90 px-4 py-2 rounded-full shadow
                     border border-green-300 font-semibold md:hidden"
        >
          ☰ Filters
        </button>
      )}

      {/* 🌿 FILTER PANEL */}
      {!panelVisible && (
        <div
          className={`absolute top-20 left-4 z-[9999]
                      bg-white/95 backdrop-blur
                      rounded-2xl shadow-lg border border-green-200
                      p-4 w-56 space-y-4
                      transition-all duration-300
                      ${filtersOpen ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4 pointer-events-none"}
                      md:opacity-100 md:translate-x-0 md:pointer-events-auto`}
        >
          <h3 className="text-sm font-bold text-green-900 uppercase">Filters</h3>

          {/* PLACES */}
          <div className="flex justify-between">
            <span>🌿 Places</span>
            <button onClick={() => setShowPlaces(!showPlaces)}>
              {showPlaces ? "On" : "Off"}
            </button>
          </div>

          {/* EVENTS */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>📅 Events</span>
              <button onClick={() => setShowEvents(!showEvents)}>
                {showEvents ? "On" : "Off"}
              </button>
            </div>

            {showEvents && (
              <div className="ml-4 space-y-1 text-sm">
                {["all", "today", "week"].map((v) => (
                  <label key={v} className="flex gap-2">
                    <input
                      type="radio"
                      checked={eventTimeFilter === v}
                      onChange={() => setEventTimeFilter(v)}
                    />
                    {v === "all" ? "All" : v === "today" ? "Today" : "This Week"}
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* BACKDROP */}
      {panelVisible && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[998]"
          onClick={() => setSelectedPlace(null)}
        />
      )}

      {/* SIDE PANEL (mobile full width) */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-[360px]
                    bg-white shadow-2xl z-[999]
                    transform transition-all duration-300
                    ${panelVisible ? "translate-x-0" : "translate-x-full"}`}
      >
        {selectedPlace && (
          <div className="flex flex-col h-full p-5 overflow-y-auto">
            <button
              className="self-end text-2xl"
              onClick={() => setSelectedPlace(null)}
            >
              ✕
            </button>

            <h2 className="text-2xl font-bold">{selectedPlace.title}</h2>
            <p className="text-sm text-gray-600 mb-2">
              {selectedPlace.type} · {selectedPlace.category}
            </p>

            {selectedPlace.description && (
              <p className="mb-4">{selectedPlace.description}</p>
            )}

            {selectedPlace.vibes?.length > 0 && (
              <div className="mb-4">
                <p className="font-semibold">🌿 Vibes</p>
                <div className="flex flex-wrap gap-2">
                  {selectedPlace.vibes.map((v) => (
                    <span key={v} className="px-2 py-1 bg-green-100 rounded-full text-sm">
                      {v}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {selectedPlace.type === "event" && (
              <div className="text-sm space-y-1">
                <p><strong>Starts:</strong> {new Date(selectedPlace.start_time).toLocaleString()}</p>
                <p><strong>Ends:</strong> {new Date(selectedPlace.end_time).toLocaleString()}</p>
              </div>
            )}

            <button
              onClick={() => openDirections(selectedPlace)}
              className="mt-auto bg-green-600 text-white py-2 rounded-lg"
            >
              🌍 Get Directions
            </button>
          </div>
        )}
      </div>

      {/* MAP */}
      <MapContainer
        center={[29.9511, -90.0715]}
        zoom={12}
        minZoom={10}
        maxZoom={18}
        maxBounds={[[29.6, -90.3], [30.2, -89.8]]}
        maxBoundsViscosity={1}
        className="h-full w-full"
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {showPlaces && places.map((p) => (
          <Marker key={`p-${p.id}`} position={[p.lat, p.lng]}>
            <Popup>
              <strong>{p.title}</strong><br />
              <span onClick={() => setSelectedPlace(p)} className="underline cursor-pointer">
                View details →
              </span>
            </Popup>
          </Marker>
        ))}

        {showEvents && filterEventsByTime(events).map((e) => (
          <Marker key={`e-${e.id}`} position={[e.lat, e.lng]} icon={eventIcon}>
            <Popup>
              <strong>{e.title}</strong><br />
              <span onClick={() => setSelectedPlace(e)} className="underline cursor-pointer">
                View event →
              </span>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
