export type IndiaCityTier = "tier1" | "tier2";

export type ApprovedIndiaCity = {
  name: string;
  slug: string;
  state: string;
  country: "IN";
  tier: IndiaCityTier;
  latitude: string;
  longitude: string;
  aliases?: readonly string[];
};

/**
 * Product-curated discovery catalogue. “Tier” is a Just Finds availability
 * label for major Indian cities, not a claim about an official government tier.
 */
export const approvedIndiaCities: readonly ApprovedIndiaCity[] = [
  { name: "Ahmedabad", slug: "ahmedabad", state: "Gujarat", country: "IN", tier: "tier1", latitude: "23.0225", longitude: "72.5714" },
  { name: "Bengaluru", slug: "bengaluru", state: "Karnataka", country: "IN", tier: "tier1", latitude: "12.9716", longitude: "77.5946", aliases: ["bangalore"] },
  { name: "Chennai", slug: "chennai", state: "Tamil Nadu", country: "IN", tier: "tier1", latitude: "13.0827", longitude: "80.2707" },
  { name: "Delhi", slug: "delhi", state: "Delhi", country: "IN", tier: "tier1", latitude: "28.6139", longitude: "77.2090", aliases: ["new delhi", "nct of delhi"] },
  { name: "Hyderabad", slug: "hyderabad", state: "Telangana", country: "IN", tier: "tier1", latitude: "17.3850", longitude: "78.4867" },
  { name: "Kolkata", slug: "kolkata", state: "West Bengal", country: "IN", tier: "tier1", latitude: "22.5726", longitude: "88.3639", aliases: ["calcutta"] },
  { name: "Mumbai", slug: "mumbai", state: "Maharashtra", country: "IN", tier: "tier1", latitude: "19.0760", longitude: "72.8777", aliases: ["bombay"] },
  { name: "Pune", slug: "pune", state: "Maharashtra", country: "IN", tier: "tier1", latitude: "18.5204", longitude: "73.8567" },
  { name: "Agra", slug: "agra", state: "Uttar Pradesh", country: "IN", tier: "tier2", latitude: "27.1767", longitude: "78.0081" },
  { name: "Amritsar", slug: "amritsar", state: "Punjab", country: "IN", tier: "tier2", latitude: "31.6340", longitude: "74.8723" },
  { name: "Aurangabad", slug: "aurangabad", state: "Maharashtra", country: "IN", tier: "tier2", latitude: "19.8762", longitude: "75.3433" },
  { name: "Bhopal", slug: "bhopal", state: "Madhya Pradesh", country: "IN", tier: "tier2", latitude: "23.2599", longitude: "77.4126" },
  { name: "Bhubaneswar", slug: "bhubaneswar", state: "Odisha", country: "IN", tier: "tier2", latitude: "20.2961", longitude: "85.8245" },
  { name: "Chandigarh", slug: "chandigarh", state: "Chandigarh", country: "IN", tier: "tier2", latitude: "30.7333", longitude: "76.7794" },
  { name: "Coimbatore", slug: "coimbatore", state: "Tamil Nadu", country: "IN", tier: "tier2", latitude: "11.0168", longitude: "76.9558" },
  { name: "Dehradun", slug: "dehradun", state: "Uttarakhand", country: "IN", tier: "tier2", latitude: "30.3165", longitude: "78.0322" },
  { name: "Guwahati", slug: "guwahati", state: "Assam", country: "IN", tier: "tier2", latitude: "26.1445", longitude: "91.7362" },
  { name: "Hubballi-Dharwad", slug: "hubballi-dharwad", state: "Karnataka", country: "IN", tier: "tier2", latitude: "15.3647", longitude: "75.1240", aliases: ["hubballi", "hubli", "dharwad"] },
  { name: "Indore", slug: "indore", state: "Madhya Pradesh", country: "IN", tier: "tier2", latitude: "22.7196", longitude: "75.8577" },
  { name: "Jaipur", slug: "jaipur", state: "Rajasthan", country: "IN", tier: "tier2", latitude: "26.9124", longitude: "75.7873" },
  { name: "Jammu", slug: "jammu", state: "Jammu and Kashmir", country: "IN", tier: "tier2", latitude: "32.7266", longitude: "74.8570" },
  { name: "Jamshedpur", slug: "jamshedpur", state: "Jharkhand", country: "IN", tier: "tier2", latitude: "22.8046", longitude: "86.2029" },
  { name: "Jodhpur", slug: "jodhpur", state: "Rajasthan", country: "IN", tier: "tier2", latitude: "26.2389", longitude: "73.0243" },
  { name: "Kanpur", slug: "kanpur", state: "Uttar Pradesh", country: "IN", tier: "tier2", latitude: "26.4499", longitude: "80.3319" },
  { name: "Kochi", slug: "kochi", state: "Kerala", country: "IN", tier: "tier2", latitude: "9.9312", longitude: "76.2673", aliases: ["cochin"] },
  { name: "Kota", slug: "kota", state: "Rajasthan", country: "IN", tier: "tier2", latitude: "25.2138", longitude: "75.8648" },
  { name: "Lucknow", slug: "lucknow", state: "Uttar Pradesh", country: "IN", tier: "tier2", latitude: "26.8467", longitude: "80.9462" },
  { name: "Madurai", slug: "madurai", state: "Tamil Nadu", country: "IN", tier: "tier2", latitude: "9.9252", longitude: "78.1198" },
  { name: "Mangaluru", slug: "mangaluru", state: "Karnataka", country: "IN", tier: "tier2", latitude: "12.9141", longitude: "74.8560", aliases: ["mangalore"] },
  { name: "Meerut", slug: "meerut", state: "Uttar Pradesh", country: "IN", tier: "tier2", latitude: "28.9845", longitude: "77.7064" },
  { name: "Mysuru", slug: "mysuru", state: "Karnataka", country: "IN", tier: "tier2", latitude: "12.2958", longitude: "76.6394", aliases: ["mysore"] },
  { name: "Nagpur", slug: "nagpur", state: "Maharashtra", country: "IN", tier: "tier2", latitude: "21.1458", longitude: "79.0882" },
  { name: "Nashik", slug: "nashik", state: "Maharashtra", country: "IN", tier: "tier2", latitude: "19.9975", longitude: "73.7898", aliases: ["nasik"] },
  { name: "Patna", slug: "patna", state: "Bihar", country: "IN", tier: "tier2", latitude: "25.5941", longitude: "85.1376" },
  { name: "Prayagraj", slug: "prayagraj", state: "Uttar Pradesh", country: "IN", tier: "tier2", latitude: "25.4358", longitude: "81.8463", aliases: ["allahabad"] },
  { name: "Raipur", slug: "raipur", state: "Chhattisgarh", country: "IN", tier: "tier2", latitude: "21.2514", longitude: "81.6296" },
  { name: "Rajkot", slug: "rajkot", state: "Gujarat", country: "IN", tier: "tier2", latitude: "22.3039", longitude: "70.8022" },
  { name: "Ranchi", slug: "ranchi", state: "Jharkhand", country: "IN", tier: "tier2", latitude: "23.3441", longitude: "85.3096" },
  { name: "Siliguri", slug: "siliguri", state: "West Bengal", country: "IN", tier: "tier2", latitude: "26.7271", longitude: "88.3953" },
  { name: "Srinagar", slug: "srinagar", state: "Jammu and Kashmir", country: "IN", tier: "tier2", latitude: "34.0837", longitude: "74.7973" },
  { name: "Surat", slug: "surat", state: "Gujarat", country: "IN", tier: "tier2", latitude: "21.1702", longitude: "72.8311" },
  { name: "Thiruvananthapuram", slug: "thiruvananthapuram", state: "Kerala", country: "IN", tier: "tier2", latitude: "8.5241", longitude: "76.9366", aliases: ["trivandrum"] },
  { name: "Tiruchirappalli", slug: "tiruchirappalli", state: "Tamil Nadu", country: "IN", tier: "tier2", latitude: "10.7905", longitude: "78.7047", aliases: ["trichy", "tiruchirapalli"] },
  { name: "Udaipur", slug: "udaipur", state: "Rajasthan", country: "IN", tier: "tier2", latitude: "24.5854", longitude: "73.7125" },
  { name: "Vadodara", slug: "vadodara", state: "Gujarat", country: "IN", tier: "tier2", latitude: "22.3072", longitude: "73.1812", aliases: ["baroda"] },
  { name: "Varanasi", slug: "varanasi", state: "Uttar Pradesh", country: "IN", tier: "tier2", latitude: "25.3176", longitude: "82.9739", aliases: ["benaras"] },
  { name: "Vijayawada", slug: "vijayawada", state: "Andhra Pradesh", country: "IN", tier: "tier2", latitude: "16.5062", longitude: "80.6480" },
  { name: "Visakhapatnam", slug: "visakhapatnam", state: "Andhra Pradesh", country: "IN", tier: "tier2", latitude: "17.6868", longitude: "83.2185", aliases: ["vizag"] },
  { name: "Warangal", slug: "warangal", state: "Telangana", country: "IN", tier: "tier2", latitude: "17.9689", longitude: "79.5941" },
];

function normalizedCityName(value: string) {
  return value.trim().toLocaleLowerCase("en-IN").replace(/[^a-z0-9]+/g, " ").trim();
}

export function findApprovedIndiaCity(value: string) {
  const target = normalizedCityName(value);
  return approvedIndiaCities.find(city => [city.name, city.slug, ...(city.aliases ?? [])].some(candidate => normalizedCityName(candidate) === target));
}

export function isApprovedIndiaTierCity(city: { name: string; slug: string; country?: string | null; tier?: string | null }) {
  return city.country === "IN" && (city.tier === "tier1" || city.tier === "tier2") && Boolean(findApprovedIndiaCity(city.slug) ?? findApprovedIndiaCity(city.name));
}
