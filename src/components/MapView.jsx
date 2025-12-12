// MapView.jsx
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { useEffect, useMemo, useState } from "react";
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

  // 📅 EVENT TIME FILTER
  const [eventTimeFilter, setEventTimeFilter] = useState("all"); // "all" | "today" | "week"

  // 📱 MOBILE FILTER VISIBILITY
  const [filtersOpen, setFiltersOpen] = useState(false);

  const panelVisible = Boolean(selectedPlace);

  // Notify parent when panel opens/closes (so MapPage can blur/hide profile/buttons)
  useEffect(() => {
    onPanelToggle?.(panelVisible);
  }, [panelVisible, onPanelToggle]);

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

      if (Array.isArray(p.vibes)) vibes = p.vibes;
      else if (typeof p.vibes === "string") {
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

      if (Array.isArray(e.vibes)) vibes = e.vibes;
      else if (typeof e.vibes === "string") {
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
  function filterEventsByTime(list) {
    if (eventTimeFilter === "all") return list;

    const now = new Date();

    if (eventTimeFilter === "today") {
      const startOfDay = new Date(now);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(now);
      endOfDay.setHours(23, 59, 59, 999);

      return list.filter((e) => {
        const start = new Date(e.start_time);
        return start >= startOfDay && start <= endOfDay;
      });
    }

    if (eventTimeFilter === "week") {
      const endOfWeek = new Date(now);
      endOfWeek.setDate(endOfWeek.getDate() + 7);

      return list.filter((e) => {
        const start = new Date(e.start_time);
        return start >= now && start <= endOfWeek;
      });
    }

    return list;
  }

  const filteredEvents = useMemo(() => filterEventsByTime(events), [events, eventTimeFilter]);

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

  // Helps keep mobile side panel not “full screen”
  const panelShellClasses = `
    fixed right-0 z-[999] bg-white shadow-2xl transform transition-all duration-300
    ${panelVisible ? "translate-x-0" : "translate-x-full"}
    /* Desktop/tablet */
    sm:top-0 sm:bottom-0 sm:h-full sm:w-[360px] sm:rounded-none
    /* Mobile: not full screen */
    top-4 bottom-4 h-auto w-[92vw] max-w-[360px]
    rounded-l-3xl rounded-r-none overflow-hidden
  `;

  return (
    <div className="relative h-full w-full">
      {/* 🏠 BACK TO HOME (hide when panel open so it doesn’t overlap mobile panel) */}
      {!panelVisible && (
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
      )}

      {/* ☰ FILTER TOGGLE (mobile) — moved DOWN so it won’t sit on Leaflet +/- */}
      {!panelVisible && (
        <button
          onClick={() => setFiltersOpen((p) => !p)}
          className="absolute top-20 left-4 z-[9999]
                     bg-white/90 px-4 py-2 rounded-full shadow
                     border border-green-300 font-semibold
                     backdrop-blur-sm transition
                     md:hidden"
        >
          ☰ Filters
        </button>
      )}

      {/* 🌿 FILTER PANEL (desktop always visible; mobile toggled) */}
      {!panelVisible && (
        <div
          className={`
            absolute left-4 z-[9999]
            bg-white/90 backdrop-blur-md
            rounded-2xl shadow-lg border border-green-200
            p-4 w-56 space-y-4
            transition-all duration-300
            /* Desktop */
            md:top-20 md:opacity-100 md:translate-x-0 md:pointer-events-auto
            /* Mobile */
            top-32
            ${filtersOpen ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2 pointer-events-none"}
            md:pointer-events-auto
          `}
        >
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
                ${
                  showPlaces
                    ? "bg-green-600 text-white"
                    : "bg-green-100 text-green-800 hover:bg-green-200"
                }`}
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
                  ${
                    showEvents
                      ? "bg-blue-600 text-white"
                      : "bg-blue-100 text-blue-800 hover:bg-blue-200"
                  }`}
              >
                {showEvents ? "On" : "Off"}
              </button>
            </div>

            {/* EVENT TIME FILTERS */}
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
      )}

      {/* BACKDROP */}
      {panelVisible && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[998]"
          onClick={() => setSelectedPlace(null)}
        />
      )}

      {/* SIDE PANEL (keep your “cool” UI, but mobile is NOT full screen) */}
      <div className={panelShellClasses}>
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

              <hr className="my-4 border-green-200" />

              {/* DESCRIPTION */}
              {selectedPlace.description && (
                <div className="mb-4">
                  <p className="font-semibold text-green-900 flex items-center gap-2">
                    <span className="text-lg">📝</span> Description
                  </p>
                  <p className="mt-1 text-gray-700 leading-relaxed">
                    {selectedPlace.description}
                  </p>
                </div>
              )}

              {/* VIBES */}
              {Array.isArray(selectedPlace.vibes) && selectedPlace.vibes.length > 0 && (
                <>
                  <hr className="my-4 border-green-200" />
                  <div className="mb-4">
                    <p className="font-semibold text-green-900 flex items-center gap-2">
                      <span className="text-lg">🌿</span> Vibes
                    </p>

                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedPlace.vibes.map((v) => (
                        <span
                          key={v}
                          className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium"
                        >
                          {v}
                        </span>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* EVENT TIMES */}
              {selectedPlace.type === "event" && (
                <>
                  <hr className="my-4 border-green-200" />
                  <div className="text-sm space-y-2">
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
                </>
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
          [29.6, -90.3],
          [30.2, -89.8],
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
                <strong>{place.title}</strong>
                <br />
                <span
                  className="text-green-800 underline cursor-pointer"
                  onClick={() => setSelectedPlace(place)}
                >
                  View details →
                </span>
              </Popup>
            </Marker>
          ))}

        {/* EVENTS */}
        {showEvents &&
          filteredEvents.map((event) => (
            <Marker
              key={`event-${event.id}`}
              position={[event.lat, event.lng]}
              icon={eventIcon}
            >
              <Popup>
                <strong>{event.title}</strong>
                <br />
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
