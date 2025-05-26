const BASE_URL = "http://localhost:8080";
const DEFAULT_TIMEOUT = 5000; // Default timeout in milliseconds
const DEFAULT_RETRIES = 3; // Default number of retries

export const fetcher = async <T>(
  endpoint: string,
  options: RequestInit = {},
  retries = DEFAULT_RETRIES,
  timeout = DEFAULT_TIMEOUT
): Promise<T> => {
  const fetchWithTimeout = async () => {
    const controller = new AbortController();
    const signal = controller.signal;
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const headers = {
        "Content-Type": "application/json",
        ...options.headers,
      };

      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: options.method || "GET",
        headers,
        signal,
        credentials: "include", // 🔥 This is the key part for cookie-based auth
        ...options,
      });

      clearTimeout(timeoutId);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Something went wrong");
      }

      const data: T = await response.json();
      return data;
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === "AbortError") {
        throw new Error("Request timed out");
      }
      throw error;
    }
  };

  while (retries > 0) {
    try {
      return await fetchWithTimeout();
    } catch (error) {
      retries -= 1;
      console.error(
        `Retrying... (${DEFAULT_RETRIES - retries}/${DEFAULT_RETRIES})`,
        error
      );
      if (retries <= 0) {
        throw error;
      }
    }
  }

  throw new Error("Request failed after retries");
};
