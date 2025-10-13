export const defaultColorPalette = [
  "#159588", "#78B9B5", "#1976d2", "#4F959D", 
  "#71C0BB", "#43a047", "#00897b", "#607d8b", "#455a64"
];

export const currencySymbols: Record<string, string> = {
  INR: "₹", USD: "$", EUR: "€", JPY: "¥", AED: "د.إ"
};

export const formatCompactCurrency = (value: number, currency: string) => {
  if (isNaN(value)) return "-";
  const symbol = currencySymbols[currency] || "";
  return symbol + value.toLocaleString("en-US", {
    maximumFractionDigits: 2,
    notation: "compact",
  });
};

export const formatCompactNumber = (value: number) => {
  return value.toLocaleString("en-US", {
    maximumFractionDigits: 2,
    notation: "compact",
  });
};

export const getColor = (idx: number, palette = defaultColorPalette) => 
  palette[idx % palette.length];