// Utility function
export function formatDateTime(date: Date): { date: string, time: string } {
    // Format date as DD/MM/YYYY
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const dateString = `${day}/${month}/${year}`;
  
    // Format time as 12-hour HH:MM AM/PM
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    
    // Convert to 12-hour format
    hours = hours % 12;
    hours = hours ? hours : 12; // Convert 0 to 12
    
    const timeString = `${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
  
    return {
      date: dateString,
      time: timeString
    };
  }