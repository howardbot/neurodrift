// Places on the /places globe. This repository is public: cities only, never addresses.
// Chips are grouped by country in the order countries first appear here.

export interface Place {
  id: string;
  name: string;
  country: string;
  /** Province or state, when it helps. */
  area?: string;
  lat: number;
  lon: number;
}

export const PLACES: Place[] = [
  { id: "shenyang", name: "Shenyang", area: "Liaoning", country: "China", lat: 41.8057, lon: 123.4315 },
  { id: "baicheng", name: "Baicheng", area: "Jilin", country: "China", lat: 45.6196, lon: 122.8388 },
  { id: "changchun", name: "Changchun", area: "Jilin", country: "China", lat: 43.8171, lon: 125.3235 },
  { id: "harbin", name: "Harbin", area: "Heilongjiang", country: "China", lat: 45.8038, lon: 126.535 },
  { id: "beijing", name: "Beijing", country: "China", lat: 39.9042, lon: 116.4074 },
  { id: "shanghai", name: "Shanghai", country: "China", lat: 31.2304, lon: 121.4737 },
  { id: "chengdu", name: "Chengdu", area: "Sichuan", country: "China", lat: 30.5728, lon: 104.0668 },
  { id: "qingdao", name: "Qingdao", area: "Shandong", country: "China", lat: 36.0671, lon: 120.3826 },
  { id: "taian", name: "Tai'an", area: "Shandong", country: "China", lat: 36.195, lon: 117.089 },
  { id: "seoul", name: "Seoul", country: "South Korea", lat: 37.5665, lon: 126.978 },
  { id: "madison", name: "Madison", area: "Wisconsin", country: "United States", lat: 43.0731, lon: -89.4012 },
  { id: "milwaukee", name: "Milwaukee", area: "Wisconsin", country: "United States", lat: 43.0389, lon: -87.9065 },
  { id: "oregon-wi", name: "Oregon, WI", area: "Wisconsin", country: "United States", lat: 42.9261, lon: -89.3843 },
  { id: "stoughton", name: "Stoughton", area: "Wisconsin", country: "United States", lat: 42.9169, lon: -89.2179 },
  { id: "chicago", name: "Chicago", area: "Illinois", country: "United States", lat: 41.8781, lon: -87.6298 },
  { id: "minneapolis", name: "Minneapolis", area: "Minnesota", country: "United States", lat: 44.9778, lon: -93.265 },
  { id: "houston", name: "Houston", area: "Texas", country: "United States", lat: 29.7604, lon: -95.3698 },
  { id: "san-antonio", name: "San Antonio", area: "Texas", country: "United States", lat: 29.4241, lon: -98.4936 },
  { id: "los-angeles", name: "Los Angeles", area: "California", country: "United States", lat: 34.0522, lon: -118.2437 },
  { id: "san-francisco", name: "San Francisco", area: "California", country: "United States", lat: 37.7749, lon: -122.4194 },
  { id: "cancun", name: "Cancún", area: "Quintana Roo", country: "Mexico", lat: 21.1619, lon: -86.8515 },
  { id: "vancouver", name: "Vancouver", area: "British Columbia", country: "Canada", lat: 49.2827, lon: -123.1207 },
];

/** Countries in the order they first appear, each with its places. */
export const BY_COUNTRY: { country: string; places: Place[] }[] = [...new Set(PLACES.map((p) => p.country))].map((country) => ({
  country,
  places: PLACES.filter((p) => p.country === country),
}));
