import { useEffect, useCallback, useState } from 'react';
import { toast } from 'sonner';

type EventType = 'user' | 'message' | 'group' | 'initial' | 'heartbeat';

interface SSEEvent {
  type: EventType;
  data: any;
}

export const useSSE = (url: string, handlers: {
  onUserEvent?: (data: any) => void;
  onMessageEvent?: (data: any) => void;
  onGroupEvent?: (data: any) => void;
  onInitialData?: (data: any) => void;
}) => {

  const [retryCount, setRetryCount] = useState(0);

  const handleEvent = useCallback((event: MessageEvent) => {
    try {
      const parsedData: SSEEvent = JSON.parse(event.data);
      
      switch (parsedData.type) {
        case 'user':
          handlers.onUserEvent?.(parsedData.data);
          break;
        case 'message':
          handlers.onMessageEvent?.(parsedData.data);
          break;
        case 'group':
          handlers.onGroupEvent?.(parsedData.data);
          break;
        case 'initial':
          handlers.onInitialData?.(parsedData.data);
          break;
        case 'heartbeat':
          // Just keep the connection alive, no action needed
          break;
        default:
          console.warn('Unknown SSE event type:', parsedData.type);
      }
    } catch (error) {
      console.error('Error parsing SSE data:', error);
    }
  }, [handlers]);

  useEffect(() => {
    let eventSource: EventSource | null = null;
    let reconnectTimeout: NodeJS.Timeout;

    const connect = () => {
      eventSource = new EventSource(url);

      eventSource.onmessage = handleEvent;
      eventSource.onerror = (error) => {
        console.error('SSE connection error:', error);
        
        // Close the current connection
        if (eventSource) {
          eventSource.close();
          eventSource = null;
        }
        
        // Try to reconnect with exponential backoff
        const delay = Math.min(1000 * Math.pow(2, retryCount), 30000);
        setRetryCount(prev => prev + 1);
        
        reconnectTimeout = setTimeout(() => {
          connect();
        }, delay);
        
        toast.error("Connection Error! Real-time updates disconnected. Trying to reconnect...");
      };

      eventSource.onopen = () => {
        console.log('SSE connection established');
        setRetryCount(0); // Reset retry count on successful connection
      };
    };

    connect();

    return () => {
      if (eventSource) {
        eventSource.close();
      }
      clearTimeout(reconnectTimeout);
    };
  }, [url, handleEvent, toast, retryCount]);
};