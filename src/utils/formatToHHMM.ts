// Utility function to format a time string (ISO or Date) to 'HH:MM' (24-hour format)
export function formatToHHMM(timeInput: string | Date): string {
  let date: Date;
  if (typeof timeInput === 'string') {
    date = new Date(timeInput);
  } else {
    date = timeInput;
  }
  if (isNaN(date.getTime())) return '';
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}
