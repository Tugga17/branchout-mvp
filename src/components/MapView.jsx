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

export default function MapView({ refreshTrigger }) {
  const [places, setPlaces] = useState([]);
  const [events, setEvents] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState(null);

  // 🌿 FILTER STATE
  const [showPlaces, setShowPlaces] = useState(true);
  const [showEvents, setShowEvents] = useState(true);
  


  // 📅 EVENT TIME FILTER
  const [eventTimeFilter, setEventTimeFilter] = useState("all"); 
  // "all" | "today" | "week"

  useEffect(() => {
    fetchPlaces();
    fetchEvents();
  }, [refreshTrigger]);

  /* ---------------- FETCH PLACES ---------------- */
  async function fetchPlaces() {
    const { data, error } = await supabase.from("places").select("*");
    if (error) {
      console.error("Error fetching places:", error);
      return;
    }

    const cleaned = (data || []).map((p) => {
      let vibes = [];

      if (Array.isArray(p.vibes)) {
        vibes = p.vibes;
      } else if (typeof p.vibes === "string") {
        try {
          vibes = JSON.parse(p.vibes);
        } catch {
          vibes = [];
        }
      }

      return { ...p, vibes, type: "place" };
    });

    setPlaces(cleaned);
  }

  /* ---------------- FETCH EVENTS ---------------- */
  async function fetchEvents() {
    const { data, error } = await supabase.from("events").select("*");
    if (error) {
      console.error("Error fetching events:", error);
      return;
    }

    const cleaned = (data || []).map((e) => {
      let vibes = [];

      if (Array.isArray(e.vibes)) {
        vibes = e.vibes;
      } else if (typeof e.vibes === "string") {
        try {
          vibes = JSON.parse(e.vibes);
        } catch {
          vibes = [];
        }
      }

      return { ...e, vibes, type: "event" };
    });

    setEvents(cleaned);
  }

  /* ---------------- EVENT TIME FILTER LOGIC ---------------- */
  function filterEventsByTime(events) {
    if (eventTimeFilter === "all") return events;

    const now = new Date();

    if (eventTimeFilter === "today") {
      const startOfDay = new Date(now);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(now);
      endOfDay.setHours(23, 59, 59, 999);

      return events.filter((e) => {
        const start = new Date(e.start_time);
        return start >= startOfDay && start <= endOfDay;
      });
    }

    if (eventTimeFilter === "week") {
      const endOfWeek = new Date(now);
      endOfWeek.setDate(endOfWeek.getDate() + 7);

      return events.filter((e) => {
        const start = new Date(e.start_time);
        return start >= now && start <= endOfWeek;
      });
    }

    return events;
  }

  /* ---------------- OPEN DIRECTIONS ---------------- */
  function openDirections(item) {
    if (!item?.lat || !item?.lng) return;

    const appleMapsUrl = `http://maps.apple.com/?daddr=${item.lat},${item.lng}`;
    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${item.lat},${item.lng}`;

    const isIOS =
      /iPhone|iPad|iPod/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

    window.open(isIOS ? appleMapsUrl : googleMapsUrl, "_blank");
  }

  const panelVisible = Boolean(selectedPlace);

  return (
    <div className="relative h-full w-full">

      {/* 🏠 BACK TO HOME */}
      <button
        onClick={() => (window.location.href = "/")}
        className="absolute bottom-6 left-6 z-[9999]
                   bg-white/90 hover:bg-white
                   text-green-900 font-semibold
                   px-4 py-2 rounded-full shadow-lg
                   border border-green-300
                   backdrop-blur-sm transition"
      >
        ⬅ Home
      </button>

      {/* 🌿 FILTER PANEL */}
      <div className="absolute top-20 left-4 z-[9999]
                      bg-white/90 backdrop-blur-md
                      rounded-2xl shadow-lg
                      border border-green-200
                      p-4 w-56 space-y-4">

        <h3 className="text-sm font-bold text-green-900 uppercase tracking-wide">
          Filters
        </h3>

        {/* 🌿 PLACES TOGGLE */}
        <div className="flex items-center justify-between">
          <span className="font-medium text-green-800 flex items-center gap-2">
            🌿 Places
          </span>
          <button
            onClick={() => setShowPlaces(!showPlaces)}
            className={`px-3 py-1 rounded-full text-sm font-semibold transition
              ${showPlaces
                ? "bg-green-600 text-white"
                : "bg-green-100 text-green-800 hover:bg-green-200"}`}
          >
            {showPlaces ? "On" : "Off"}
          </button>
        </div>

        {/* 📅 EVENTS SECTION */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-medium text-blue-800 flex items-center gap-2">
              📅 Events
            </span>
            <button
              onClick={() => setShowEvents(!showEvents)}
              className={`px-3 py-1 rounded-full text-sm font-semibold transition
                ${showEvents
                  ? "bg-blue-600 text-white"
                  : "bg-blue-100 text-blue-800 hover:bg-blue-200"}`}
            >
              {showEvents ? "On" : "Off"}
            </button>
          </div>

          {/* EVENT TIME FILTERS (only visible if events ON) */}
          {showEvents && (
            <div className="ml-6 mt-2 space-y-1">
              {[
                { label: "All", value: "all" },
                { label: "Today", value: "today" },
                { label: "This Week", value: "week" },
              ].map((opt) => (
                <label
                  key={opt.value}
                  className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="eventTime"
                    checked={eventTimeFilter === opt.value}
                    onChange={() => setEventTimeFilter(opt.value)}
                    className="accent-blue-600"
                  />

                  {opt.label}
                </label>
              ))}
            </div>
          )}
        </div>
      </div>


      {/* BACKDROP */}
      {panelVisible && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[998]"
          onClick={() => setSelectedPlace(null)}
        />
      )}

      {/* SIDE PANEL */}
      <div
        className={`fixed top-0 right-0 h-full w-[360px] bg-white shadow-2xl z-[999]
                    transform transition-all duration-300
                    ${panelVisible ? "translate-x-0" : "translate-x-full"}`}
      >
        {selectedPlace && (
          <div className="flex flex-col h-full">

            {/* IMAGE HEADER */}
            <div className="relative h-44 w-full">
              {selectedPlace.image_url ? (
                <img
                  src={selectedPlace.image_url}
                  className="w-full h-full object-cover"
                  alt="Cover"
                />
              ) : (
                <div className="w-full h-full bg-green-200 flex items-center justify-center text-green-800 font-bold">
                  No Image
                </div>
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

              <button
                className="absolute top-3 right-3 text-white text-2xl"
                onClick={() => setSelectedPlace(null)}
              >
                ✕
              </button>
            </div>

            {/* CONTENT */}
            <div className="flex-1 overflow-y-auto p-5">

              {/* TITLE */}
              <h2 className="text-2xl font-bold text-green-900">
                {selectedPlace.title}
              </h2>

              {/* TYPE + CATEGORY */}
              <p className="text-sm text-green-700 mb-2">
                {selectedPlace.type === "event" ? "📅 Event" : "📍 Place"}
                {selectedPlace.category && <> · {selectedPlace.category}</>}
              </p>

              {/* DESCRIPTION */}
              {selectedPlace.description && (
                <p className="text-gray-700 mt-2">
                  {selectedPlace.description}
                </p>
              )}

              {/* 🌿 VIBES (PLACES + EVENTS) */}
              {Array.isArray(selectedPlace.vibes) &&
                selectedPlace.vibes.length > 0 && (
                  <div className="mt-4">
                    <p className="font-semibold text-green-900 mb-2">🌿 Vibes</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedPlace.vibes.map((v) => (
                        <span
                          key={v}
                          className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                        >
                          {v}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

              {/* EVENT TIME INFO */}
              {selectedPlace.type === "event" && (
                <div className="mt-4 space-y-2 text-sm">
                  {selectedPlace.start_time && (
                    <p>
                      <strong>Starts:</strong>{" "}
                      {new Date(selectedPlace.start_time).toLocaleString()}
                    </p>
                  )}
                  {selectedPlace.end_time && (
                    <p>
                      <strong>Ends:</strong>{" "}
                      {new Date(selectedPlace.end_time).toLocaleString()}
                    </p>
                  )}
                </div>
              )}

              {/* DIRECTIONS */}
              <button
                onClick={() => openDirections(selectedPlace)}
                className="w-full mt-6 bg-green-600 hover:bg-green-700
                          text-white py-2 rounded-lg font-semibold transition"
              >
                🌍 Get Directions
              </button>
            </div>
          </div>
        )}
      </div>


      {/* MAP */}
      <MapContainer
        center={[29.9511, -90.0715]}
        zoom={12}
        minZoom={10}
        maxZoom={18}
        maxBounds={[
          [29.6, -90.3],   // southwest corner (slightly outside NOLA)
          [30.2, -89.8],   // northeast corner
        ]}
        maxBoundsViscosity={1.0}
        className="h-full w-full z-0 relative"
      >

        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {/* PLACES */}
        {showPlaces &&
          places.map((place) => (
            <Marker key={`place-${place.id}`} position={[place.lat, place.lng]}>
              <Popup>
                <strong>{place.title}</strong><br />
                <span
                  className="text-green-800 underline cursor-pointer"
                  onClick={() => setSelectedPlace(place)}
                >
                  View details →
                </span>
              </Popup>
            </Marker>
          ))}

        {/* EVENTS (FILTERED) */}
        {showEvents &&
          filterEventsByTime(events).map((event) => (
            <Marker
              key={`event-${event.id}`}
              position={[event.lat, event.lng]}
              icon={eventIcon}
            >
              <Popup>
                <strong>{event.title}</strong><br />
                <span
                  className="text-blue-700 underline cursor-pointer"
                  onClick={() => setSelectedPlace(event)}
                >
                  View event →
                </span>
              </Popup>
            </Marker>
          ))}
      </MapContainer>
    </div>
  );
}
