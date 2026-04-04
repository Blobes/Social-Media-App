export const getInitialsAndColors = (
  value: string,
): { initials: string; textColor: string; bgColor: string } => {
  const parts = value.trim().split(/\s+/);
  const initials =
    (parts[0]?.[0] || "").toUpperCase() + (parts[1]?.[0] || "").toUpperCase();

  // Hash function from initials → number
  const hashCode = (str: string): number =>
    str.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);

  const hash = hashCode(initials || value);

  // Generate "random" but consistent colors
  const randomColor = (seed: number): string =>
    `#${((seed * 16777619) >>> 0).toString(16).slice(-6).padStart(6, "0")}`;

  const bgColor = randomColor(hash);
  const textColor = randomColor(hash * 13); // offset multiplier for variety

  return { initials, textColor, bgColor };
};
