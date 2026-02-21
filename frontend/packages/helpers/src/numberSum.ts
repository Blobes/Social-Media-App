// Number Summarizer
export const summarizeNum = (digit: string | number): string => {
  const num = typeof digit === "string" ? Number(digit) : digit;

  if (isNaN(num)) return "0";

  const n = Math.abs(num);

  let divider: number;
  let level: string;

  if (n < 1_000) {
    return num.toString();
  } else if (n < 1_000_000) {
    divider = 1_000;
    level = "K";
  } else if (n < 1_000_000_000) {
    divider = 1_000_000;
    level = "M";
  } else {
    divider = 1_000_000_000;
    level = "B";
  }

  const a = num / divider;
  const whole = Math.trunc(a);
  const decimalPart = a - whole;

  // Format based on magnitude
  if (decimalPart === 0 || whole >= 100) {
    return `${whole}${level}`;
  } else {
    // Show 1 decimal place if meaningful
    const formatted = a.toFixed(1);
    // Remove trailing .0 if not needed
    return `${formatted.replace(/\.0$/, "")}${level}`;
  }
};
