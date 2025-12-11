export default function PlaceDetailsPanel({ place, onClose }) {
  return (
    <div className="w-80 md:w-96 h-full bg-white shadow-2xl p-5 border-l border-gray-200 fixed right-0 top-0 z-[9999] overflow-y-auto">

      <button
        onClick={onClose}
        className="text-gray-600 hover:text-black text-xl mb-4"
      >
        ✕
      </button>

      {/* Image */}
      {place.image_url && (
        <img
          src={place.image_url}
          alt={place.title}
          className="rounded-lg mb-4 w-full h-48 object-cover"
        />
      )}

      <h2 className="text-2xl font-bold mb-2">{place.title}</h2>

      <p className="text-green-700 font-semibold mb-2">
        {place.category}
      </p>

      {place.description && (
        <p className="text-gray-800 mb-4">{place.description}</p>
      )}

      {place.vibes && (
        <div className="bg-green-100 p-3 rounded">
          <p className="font-medium text-green-900">Vibes</p>
          <p className="text-gray-700">{place.vibes}</p>
        </div>
      )}

    </div>
  );
}
