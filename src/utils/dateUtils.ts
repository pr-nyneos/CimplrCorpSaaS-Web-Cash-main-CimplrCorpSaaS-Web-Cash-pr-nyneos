// dateUtils.ts
import * as XLSX from "xlsx";
//comments
function isLikelyDate(val: unknown): boolean {
  if (val instanceof Date) return true;
  if (typeof val === "number" && val > 25569 && val < 60000) return true;
  if (typeof val === "string" && /^\d{4}-\d{2}-\d{2}/.test(val)) return true;
  if (typeof val === "string" && /^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(val)) return true;
  if (typeof val === "string" && /^\d{1,2}-\d{1,2}-\d{2,4}$/.test(val)) return true;
  return false;
}

function formatToYYYYMMDD(val: Date | number | string): string {
  let date: Date | null = null;

  if (val instanceof Date) {
    date = val;
  } else if (typeof val === "number") {
    try {
      const parsed = XLSX.SSF.parse_date_code(val);
      if (parsed && parsed.y && parsed.m && parsed.d) {
        date = new Date(Date.UTC(parsed.y, parsed.m - 1, parsed.d));
      }
    } catch {}
  } else if (typeof val === "string") {
    let d: string | undefined, m: string | undefined, y: string | undefined;

    if (/^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(val)) {
      [d, m, y] = val.split("/");
    } else if (/^\d{1,2}-\d{1,2}-\d{2,4}$/.test(val)) {
      [d, m, y] = val.split("-");
    }

    if (d && m && y) {
      const yyyy = y.length === 2 ? (parseInt(y, 10) > 50 ? "19" + y : "20" + y) : y;
      date = new Date(`${yyyy}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`);
    } else {
      const parts = val.split(/[-\/]/);
      if (parts.length === 3) {
        if (val.includes("-")) {
          if (parts[0].length === 4) {
            date = new Date(`${parts[0]}-${parts[1]}-${parts[2]}`);
          } else {
            date = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
          }
        } else if (val.includes("/")) {
          date = new Date(`${parts[2]}-${parts[0]}-${parts[1]}`);
        }
      }
      if (!date || isNaN(date.getTime())) {
        date = new Date(val);
      }
    }
  }

  if (date && !isNaN(date.getTime())) {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }

  return String(val);
}

export { isLikelyDate, formatToYYYYMMDD };