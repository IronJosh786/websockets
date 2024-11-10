import http from "http";
import express from "express";
import { v4 as uuidv4 } from "uuid";
import WebSocket, { WebSocketServer } from "ws";

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const rooms = new Map<string, { userId: string; ws: WebSocket }[]>();
const users = new Map<string, string>();

const joinRoom = (roomId: string, userId: string, ws: WebSocket) => {
  leaveRoom(userId);
  let room = rooms.get(roomId);
  if (!room) {
    room = [{ userId, ws }];
    rooms.set(roomId, room);
  } else {
    room.push({ userId, ws });
  }
  broadcast("A user has joined the chat!", roomId);
  return;
};

const leaveRoom = (id: string) => {
  const roomId = users.get(id);
  if (!roomId) {
    return;
  }
  const usersInRoom = rooms.get(roomId);
  if (!usersInRoom?.length || usersInRoom.length === 1) {
    rooms.delete(roomId);
  } else {
    const newUsersInRoom = usersInRoom.filter(({ userId }) => userId !== id);
    rooms.set(roomId, newUsersInRoom);
    broadcast("A user has left the chat!", roomId);
  }
  return;
};

const handleClose = (id: string) => {
  leaveRoom(id);
  users.delete(id);
  return;
};

const handleMessage = (message: string, userId: string, ws: WebSocket) => {
  const data = JSON.parse(message.toString());
  if (data.type === "join") {
    const roomId = data.payload.roomId;
    joinRoom(roomId, userId, ws);
    users.set(userId, roomId);
  } else if (data.type === "message") {
    const message = data.payload.message;
    const roomId = users.get(userId);
    if (!roomId) return;
    broadcast(message, roomId);
  } else {
    ws.send("Unknown message type");
  }
  return;
};

const broadcast = (message: string, roomId: string) => {
  const room = rooms.get(roomId);
  if (!room?.length) return;
  room.forEach((user) => {
    const { ws } = user;
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(message);
    }
  });
};

wss.on("connection", (ws) => {
  const id = uuidv4();
  const roomId = "default";

  joinRoom(roomId, id, ws);
  users.set(id, roomId);

  ws.on("close", () => handleClose(id));
  ws.on("message", (message: string) => handleMessage(message, id, ws));

  ws.send("Welcome to the chat!");
});

server.listen(3000, () => {
  console.log("Server is listening on port 3000");
});
