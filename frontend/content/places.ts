// Places on the /places globe. This repository is public: cities only, never addresses.
// Chips are grouped by country in the order countries first appear here.

export interface Place {
  id: string;
  name: string;
  country: string;
  /** Province or state, when it helps. */
  area?: string;
  /** ISO 3166-2 code of the province or state: shaded on the globe. */
  region: string;
  lat: number;
  lon: number;
}

export const PLACES: Place[] = [
  { id: "shenyang", region: "CN-LN", name: "Shenyang", area: "Liaoning", country: "China", lat: 41.8057, lon: 123.4315 },
  { id: "baicheng", region: "CN-JL", name: "Baicheng", area: "Jilin", country: "China", lat: 45.6196, lon: 122.8388 },
  { id: "changchun", region: "CN-JL", name: "Changchun", area: "Jilin", country: "China", lat: 43.8171, lon: 125.3235 },
  { id: "harbin", region: "CN-HL", name: "Harbin", area: "Heilongjiang", country: "China", lat: 45.8038, lon: 126.535 },
  { id: "beijing", region: "CN-BJ", name: "Beijing", country: "China", lat: 39.9042, lon: 116.4074 },
  { id: "shanghai", region: "CN-SH", name: "Shanghai", country: "China", lat: 31.2304, lon: 121.4737 },
  { id: "chengdu", region: "CN-SC", name: "Chengdu", area: "Sichuan", country: "China", lat: 30.5728, lon: 104.0668 },
  { id: "qingdao", region: "CN-SD", name: "Qingdao", area: "Shandong", country: "China", lat: 36.0671, lon: 120.3826 },
  { id: "taian", region: "CN-SD", name: "Tai'an", area: "Shandong", country: "China", lat: 36.195, lon: 117.089 },
  { id: "weifang", region: "CN-SD", name: "Weifang", area: "Shandong", country: "China", lat: 36.7069, lon: 119.1618 },
  { id: "dalian", region: "CN-LN", name: "Dalian", area: "Liaoning", country: "China", lat: 38.914, lon: 121.6147 },
  { id: "wuxi", region: "CN-JS", name: "Wuxi", area: "Jiangsu", country: "China", lat: 31.4912, lon: 120.3119 },
  { id: "hangzhou", region: "CN-ZJ", name: "Hangzhou", area: "Zhejiang", country: "China", lat: 30.2741, lon: 120.1551 },
  { id: "shijiazhuang", region: "CN-HE", name: "Shijiazhuang", area: "Hebei", country: "China", lat: 38.0428, lon: 114.5149 },
  { id: "zhangjiakou", region: "CN-HE", name: "Zhangjiakou", area: "Hebei", country: "China", lat: 40.7676, lon: 114.8863 },
  { id: "hohhot", region: "CN-NM", name: "Hohhot", area: "Inner Mongolia", country: "China", lat: 40.8414, lon: 111.7519 },
  { id: "seoul", region: "KR-11", name: "Seoul", country: "South Korea", lat: 37.5665, lon: 126.978 },
  { id: "madison", region: "US-WI", name: "Madison", area: "Wisconsin", country: "United States", lat: 43.0731, lon: -89.4012 },
  { id: "milwaukee", region: "US-WI", name: "Milwaukee", area: "Wisconsin", country: "United States", lat: 43.0389, lon: -87.9065 },
  { id: "oregon-wi", region: "US-WI", name: "Oregon, WI", area: "Wisconsin", country: "United States", lat: 42.9261, lon: -89.3843 },
  { id: "stoughton", region: "US-WI", name: "Stoughton", area: "Wisconsin", country: "United States", lat: 42.9169, lon: -89.2179 },
  { id: "chicago", region: "US-IL", name: "Chicago", area: "Illinois", country: "United States", lat: 41.8781, lon: -87.6298 },
  { id: "minneapolis", region: "US-MN", name: "Minneapolis", area: "Minnesota", country: "United States", lat: 44.9778, lon: -93.265 },
  { id: "houston", region: "US-TX", name: "Houston", area: "Texas", country: "United States", lat: 29.7604, lon: -95.3698 },
  { id: "san-antonio", region: "US-TX", name: "San Antonio", area: "Texas", country: "United States", lat: 29.4241, lon: -98.4936 },
  { id: "los-angeles", region: "US-CA", name: "Los Angeles", area: "California", country: "United States", lat: 34.0522, lon: -118.2437 },
  { id: "san-francisco", region: "US-CA", name: "San Francisco", area: "California", country: "United States", lat: 37.7749, lon: -122.4194 },
  { id: "cancun", region: "MX-ROO", name: "Cancún", area: "Quintana Roo", country: "Mexico", lat: 21.1619, lon: -86.8515 },
  { id: "vancouver", region: "CA-BC", name: "Vancouver", area: "British Columbia", country: "Canada", lat: 49.2827, lon: -123.1207 },
  { id: "abu-dhabi", region: "AE-AZ", name: "Abu Dhabi", country: "United Arab Emirates", lat: 24.4539, lon: 54.3773 },
];

/** Countries in the order they first appear, each with its places. */
export const BY_COUNTRY: { country: string; places: Place[] }[] = [...new Set(PLACES.map((p) => p.country))].map((country) => ({
  country,
  places: PLACES.filter((p) => p.country === country),
}));
