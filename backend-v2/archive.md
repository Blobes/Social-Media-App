/\*\*

- Fetches location data with a required User-Agent header for API compatibility.
  \*/
  export async function getLocationFromIp(ip: string | undefined) {
  if (!ip || ip === "::1" || ip === "127.0.0.1") return null;

try {
const response = await fetch(`https://ipwho.is/${ip}`, {
method: "GET",
headers: {
"User-Agent":
"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
Accept: "application/json",
"Accept-Language": "en-US,en;q=0.9",
Referer: "https://ipwhois.io/",
Origin: "https://ipwhois.io/",
"Cache-Control": "no-cache",
},
});

    if (!response.ok) {
      console.error(`HTTP Error: ${response.status}`);
      return null;
    }
    const data = (await response.json()) as any;

    if (!data.success) {
      // This will tell you if the random IP was reserved or invalid
      console.warn("IP lookup failed:", data.message);
      return null;
    }

    return {
      country: data.country,
      state: data.region,
      city: data.city,
      isp: data.connection?.isp,
      flag: data.flag?.emoji,
      latitude: data.latitude,
      longitude: data.longitude,
    };

} catch (err) {
console.error("Geo lookup network error:", err);
return null;
}
}
