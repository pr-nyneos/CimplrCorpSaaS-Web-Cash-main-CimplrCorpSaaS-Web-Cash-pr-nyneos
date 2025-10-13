// Utility function to format ISO string or Date to 'DD-MM_YY HH-MM'
export function formatToDDMMYY_HHMM(dateInput: string | Date): string {
  let date: Date;
  if (typeof dateInput === 'string') {
    date = new Date(dateInput);
  } else {
    date = dateInput;
  }
  if (isNaN(date.getTime())) return '';
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear().toString().slice(-2);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${day}-${month}-${year} ${hours}-${minutes}`;
}
