// src/app/demand/types.ts
export interface Products {
    product: string;
    uom: string;
  }
  
  export interface OrderEntry {
    concern: string;
    product: string;
    quantity: number;
  }
  
  export interface DemandSummary {
    concern: string;
    products: { product: string; quantity: number; uom: string; }[];
    timestamp: Date;
  }
  
  export function formatDateTime(date: Date): { date: string, time: string } {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const dateString = `${day}/${month}/${year}`;
  
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    
    const timeString = `${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
  
    return {
      date: dateString,
      time: timeString
    };
  }