import { NetworkStatus } from "@funstakes/types";

export const checkSignal = async (): Promise<NetworkStatus> => {
  if (!navigator.onLine) {
    return "OFFLINE";
  }
  // If navigator says we are online, but the request is taking too long:
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

  // 2. Ping an EXTERNAL reliable source
  try {
    // Use a tiny 1-pixel image or a headers-only request
    await fetch("https://www.google.com/generate_204", {
      method: "HEAD",
      mode: "no-cors", // Crucial for external pings
      signal: controller.signal,
      cache: "no-store",
    });
    return "STABLE";
  } catch (err: any) {
    // If it aborted or failed, the network is "unstable"
    if (err.name === "AbortError") return "UNSTABLE";
    return "OFFLINE";
  } finally {
    clearTimeout(timeoutId);
  }
};
