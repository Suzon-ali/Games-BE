/* eslint-disable @typescript-eslint/no-explicit-any */
import { Server as HTTPServer } from "http";
import { Server, Socket } from "socket.io";
import jwt, { JwtPayload } from "jsonwebtoken";
import config from "../config";
import cookie from "cookie";

export let io: Server;

export const initSocketServer = (server: HTTPServer): void => {
  io = new Server(server, {
    cors: {
      origin: [
        "http://localhost:3000",
        "https://games-client-fqmo.vercel.app",
        "https://games-client-production.up.railway.app",
        "http://192.168.0.183:3000",
      ],
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  console.log("🚀 Socket.IO server initialized");

  // 🔐 Middleware for optional authentication
  io.use((socket, next) => {
    let token = socket.handshake.auth?.token;

    // Optionally fallback to cookie-based token
    if (!token) {
      const rawCookie = socket?.request?.headers?.cookie || "";
      const cookiesParsed = cookie.parse(rawCookie);
      token = cookiesParsed.accessToken;
    }

    if (!token) {
      console.log("👤 Guest socket connected (no token)");
      return next(); // allow guest
    }

    try {
      const decoded = jwt.verify(
        token,
        config.jwt_access_secret as string
      ) as JwtPayload;

      console.log("✅ JWT Decoded Payload:", decoded);

      (socket as any).user = decoded;
      return next();
    } catch (err: any) {
      console.log("❌ Invalid token, connecting as guest:", err.message);
      // ⚠️ Still allow guest connection
      return next(); // allow guest even if token is invalid
    }
  });

  // 🧩 Main connection logic
  io.on("connection", (socket: Socket) => {
    const authUser = (socket as any).user || null;
    console.log(`📡 Client connected with Socket ID: ${socket.id}`);
    console.log("👤 Authenticated User:", authUser || "Guest");

    // ✅ Join room (only if authenticated)
    socket.on("join", (userId: string) => {
      if (userId) {
        socket.join(userId);
        console.log(`✅ User ${userId} joined room`);
      } else {
        console.log("⚠️ 'join' event called without userId");
      }
    });

    // 🔌 Disconnect
    socket.on("disconnect", () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);
    });
  });
};
