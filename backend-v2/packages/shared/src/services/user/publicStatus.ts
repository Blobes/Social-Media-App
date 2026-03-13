export const checkWikipedia = async (fullName: string): Promise<boolean> => {
  try {
    const url = `https://en.wikipedia.org/w/api.php?action=query&origin=*&format=json&titles=${encodeURIComponent(fullName)}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    type WikipediaApiResponse = {
      query: {
        pages: Record<string, unknown>;
      };
    };

    const data = (await response.json()) as WikipediaApiResponse;
    const pages = data.query.pages;

    // Wikipedia returns "-1" as a key if the page doesn't exist
    return !pages.hasOwnProperty("-1");
  } catch (error) {
    console.error("Wikipedia API Error:", error);
    return false;
  }
};

/**
 * Checks if an email belongs to a high-reputation or organizational domain
 */
export const checkEmailReputation = async (email: string): Promise<boolean> => {
  const domain = email.split("@")[1];
  const freeProviders = [
    "gmail.com",
    "yahoo.com",
    "outlook.com",
    "hotmail.com",
  ];

  // 1. Simple check: If it's a free provider, it's a "standard" signal
  if (freeProviders.includes(domain.toLowerCase())) {
    return false;
  }

  // 2. Real-time API check (Example using a domain research API)
  try {
    const response = await fetch(
      `https://api.domaininfo.com/v1/check?domain=${domain}`,
    );
    type DomainInfoResponse = {
      category?: string;
      is_reputable_news_source?: boolean;
    };

    const data = (await response.json()) as DomainInfoResponse;

    // If the domain is linked to a "Government" or "Large Enterprise" organization
    return (
      data.category === "Organization" || data.is_reputable_news_source === true
    );
  } catch (err) {
    return false;
  }
};

/**
 * Validates phone type and carrier
 */
export const checkPhoneIntelligence = async (
  phoneNumber: string,
): Promise<boolean> => {
  try {
    const response = await fetch(
      `https://api.phonechecker.com/v1/validate?number=${phoneNumber}`,
    );
    type PhoneCheckerResponse = {
      type?: string;
      carrier?: string | null;
    };

    const data = (await response.json()) as PhoneCheckerResponse;

    // High-value users rarely use VOIP/Virtual numbers for their primary accounts
    const isReliableType = data.type === "mobile" || data.type === "landline";
    const isRealCarrier = Boolean(data.carrier && data.carrier !== "Unknown");

    return isReliableType && isRealCarrier;
  } catch (err) {
    return false;
  }
};
