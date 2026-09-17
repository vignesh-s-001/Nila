/**
 * Geocoding & search service using OpenStreetMap Nominatim
 * Includes transit-aware POI classification (railway, bus stops, metro, etc.)
 */

export interface GeocodeLocation {
  id: string;
  name: string;
  fullName: string;
  lat: number;
  lng: number;
  category: "railway" | "bus" | "metro" | "airport" | "place";
  icon: string;
}

export async function searchLocations(query: string): Promise<GeocodeLocation[]> {
  if (!query || query.trim().length < 2) return [];

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        query.trim()
      )}&limit=6&addressdetails=1`,
      {
        headers: {
          "Accept-Language": "en",
          "User-Agent": "Nila-Mindful-Companion/1.0",
        },
      }
    );

    if (!res.ok) return [];

    const data = await res.json();
    if (!Array.isArray(data)) return [];

    return data.map((item: any) => {
      const a = item.address || {};
      const itemClass = item.class || "";
      const itemType = item.type || "";

      let category: GeocodeLocation["category"] = "place";
      let icon = "📍";

      if (
        itemClass === "railway" ||
        itemType === "station" ||
        itemType === "halt" ||
        itemType === "train_station"
      ) {
        category = "railway";
        icon = "🚆";
      } else if (
        itemClass === "bus_stop" ||
        itemType === "bus_stop" ||
        itemType === "bus_station" ||
        itemType === "platform"
      ) {
        category = "bus";
        icon = "🚌";
      } else if (itemType === "subway" || itemType === "metro" || itemClass === "subway") {
        category = "metro";
        icon = "🚇";
      } else if (itemClass === "aeroway" || itemType === "aerodrome") {
        category = "airport";
        icon = "✈️";
      }

      // Build a clean, concise name
      const primaryName =
        a.railway ||
        a.bus_stop ||
        a.subway ||
        a.station ||
        a.amenity ||
        a.road ||
        a.suburb ||
        a.neighbourhood ||
        item.display_name.split(",")[0].trim();

      const city = a.city || a.town || a.village || a.county || a.state || "";
      const shortName = city && !primaryName.includes(city) ? `${primaryName}, ${city}` : primaryName;

      return {
        id: String(item.place_id),
        name: shortName,
        fullName: item.display_name,
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
        category,
        icon,
      };
    });
  } catch {
    return [];
  }
}

