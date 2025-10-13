import { isLikelyDate, formatToYYYYMMDD } from "./dateUtils";

const parseCSV = (text: string): string[][] => {
  const lines = text.split("\n").filter((line) => line.trim());
  return lines.map((line) => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;

    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        let value = current.trim().replace(/^"|"$/g, "");
        if (isLikelyDate(value)) {
          value = formatToYYYYMMDD(value);
        }
        result.push(value);
        current = "";
      } else {
        current += char;
      }
    }
    let value = current.trim().replace(/^"|"$/g, "");
    if (isLikelyDate(value)) {
      value = formatToYYYYMMDD(value);
    }
    result.push(value);
    return result;
  });
};

export default parseCSV;