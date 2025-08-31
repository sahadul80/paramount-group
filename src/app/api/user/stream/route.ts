let users: any[] = [];
let messages: any[] = [];
let groups: any[] = [];

export async function GET() {
  const stream = new ReadableStream({
    start(controller) {
      // Send initial data
      const sendInitialData = () => {
        const data = JSON.stringify({
          type: 'initial',
          data: {
            users,
            messages,
            groups
          }
        });
        
        // Check if controller is still open before enqueuing
        try {
          controller.enqueue(`data: ${data}\n\n`);
        } catch (error) {
          console.log('Controller closed, cannot send initial data');
        }
      };

      sendInitialData();

      // Set up interval to check for changes
      const interval = setInterval(() => {
        // Check if controller is still open
        try {
          const data = JSON.stringify({
            type: 'heartbeat',
            data: { timestamp: new Date().toISOString() }
          });
          controller.enqueue(`data: ${data}\n\n`);
        } catch (error) {
          // Controller is closed, clear the interval
          clearInterval(interval);
        }
      }, 5000);

      // Cleanup on close
      return () => {
        clearInterval(interval);
      };
    },
    cancel() {
      // This is called when the connection is cancelled
      console.log('SSE connection cancelled');
    }
  });

  return new Response(stream, {
    headers: { 
      'Content-Type': 'text/event-stream', 
      'Cache-Control': 'no-cache, no-transform', 
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
    },
  });
}