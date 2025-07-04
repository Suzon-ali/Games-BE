// import { Server, Socket } from 'socket.io';
// import { BetServices } from './bet.service';

// export const registerBetSocketHandlers = (io: Server) => {
//   io.on('connection', (socket: Socket) => {
//     console.log('✅ WebSocket connected:', socket.id);

//     socket.on('place_bet', async (data, callback) => {
//         try {
//           const bet = await BetServices.placeBet(data);
//           const result = bet.result;
          
//           socket.emit('bet_result', {
//             resultNumber: result.resultNumber,
//             isWin: result.isWin,
//             profit: result.profit,
//             newBalance: result.payoutToThePlayer,
//             newNonce: data.nonce + 1,
//           });
      
//           // 👇 CHECK IF CALLBACK EXISTS
//           if (callback && typeof callback === 'function') {
//             callback({ success: true });
//           }
//         } catch (error) {
//           console.error('❌ place_bet error:', error);
      
//           // 👇 CHECK IF CALLBACK EXISTS
//           if (callback && typeof callback === 'function') {
//             callback({ success: false, message: error.message || 'Unknown error' });
//           }
//         }
//       });

//     socket.on('disconnect', () => {
//       console.log('❌ WebSocket disconnected:', socket.id);
//     });
//   });
// };
