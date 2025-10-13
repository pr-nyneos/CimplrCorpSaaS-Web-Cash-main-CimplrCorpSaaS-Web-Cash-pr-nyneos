export function formatToDDMMYYYY(dateString: string): string {
  if (!dateString) return "";
  const date = new Date(dateString);
  // Pad day and month with leading zeros
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

export function formatDate ( dateString : string ) : string {
  if (!dateString) return "";
  const date = dateString.split("T")[0]; // Extract date part before 'T'
  return date;
}