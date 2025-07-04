import { Server as HTTPServer } from 'http';
import WebSocket, { WebSocketServer } from 'ws';

const clients = new Set<WebSocket>();

export const setupWebSocket = (server: HTTPServer) => {
  const wss = new WebSocketServer({ server });

  wss.on('connection', (ws) => {
    console.log('📡 New WebSocket client connected');
    clients.add(ws);

    ws.on('close', () => {
      clients.delete(ws);
      console.log('🔌 WebSocket client disconnected');
    });
  });
};

// Export this to use in any controller (like when a user places a bet)
export const broadcastNewBet = (bet: any) => {
  const data = JSON.stringify({ type: 'NEW_BET', payload: bet });

  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
};
