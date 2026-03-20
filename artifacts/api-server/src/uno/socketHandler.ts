import { Server, Socket } from "socket.io";
import {
  createGame,
  dealInitialCards,
  playCard,
  drawFromDeck,
  getPublicState,
  GameState,
  ChatMessage,
  CardColor,
} from "./gameLogic";
import { logger } from "../lib/logger";

const rooms = new Map<string, GameState>();
const chatHistory = new Map<string, ChatMessage[]>();
const playerRooms = new Map<string, string>();

function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function broadcastGameState(io: Server, roomCode: string) {
  const state = rooms.get(roomCode);
  if (!state) return;
  for (const player of state.players) {
    const publicState = getPublicState(state, player.id);
    io.to(player.id).emit("gameState", publicState);
  }
}

export function setupSocketHandlers(io: Server) {
  io.on("connection", (socket: Socket) => {
    logger.info({ socketId: socket.id }, "Socket connected");

    socket.on("createRoom", ({ username }: { username: string }) => {
      let roomCode = generateRoomCode();
      while (rooms.has(roomCode)) {
        roomCode = generateRoomCode();
      }

      const state = createGame(roomCode);
      state.players.push({
        id: socket.id,
        username,
        hand: [],
        isConnected: true,
      });
      rooms.set(roomCode, state);
      chatHistory.set(roomCode, []);
      playerRooms.set(socket.id, roomCode);

      socket.join(roomCode);
      socket.emit("roomCreated", { roomCode });
      broadcastGameState(io, roomCode);
      logger.info({ roomCode, username }, "Room created");
    });

    socket.on("joinRoom", ({ username, roomCode }: { username: string; roomCode: string }) => {
      const state = rooms.get(roomCode.toUpperCase());
      if (!state) {
        socket.emit("error", { message: "Room not found" });
        return;
      }
      if (state.gameStarted) {
        socket.emit("error", { message: "Game already started" });
        return;
      }
      if (state.players.length >= 4) {
        socket.emit("error", { message: "Room is full (max 4 players)" });
        return;
      }

      const existingPlayer = state.players.find((p) => p.id === socket.id);
      if (!existingPlayer) {
        state.players.push({
          id: socket.id,
          username,
          hand: [],
          isConnected: true,
        });
      }
      playerRooms.set(socket.id, roomCode.toUpperCase());

      socket.join(roomCode.toUpperCase());
      socket.emit("roomJoined", { roomCode: roomCode.toUpperCase() });
      broadcastGameState(io, roomCode.toUpperCase());

      const joinMsg: ChatMessage = {
        playerId: "system",
        username: "System",
        message: `${username} joined the room`,
        timestamp: Date.now(),
      };
      chatHistory.get(roomCode.toUpperCase())?.push(joinMsg);
      io.to(roomCode.toUpperCase()).emit("chatMessage", joinMsg);
      logger.info({ roomCode, username }, "Player joined room");
    });

    socket.on("startGame", () => {
      const roomCode = playerRooms.get(socket.id);
      if (!roomCode) return;
      const state = rooms.get(roomCode);
      if (!state) return;
      if (state.players[0].id !== socket.id) {
        socket.emit("error", { message: "Only the host can start the game" });
        return;
      }
      if (state.players.length < 2) {
        socket.emit("error", { message: "Need at least 2 players to start" });
        return;
      }

      state.gameStarted = true;
      dealInitialCards(state);
      broadcastGameState(io, roomCode);

      const startMsg: ChatMessage = {
        playerId: "system",
        username: "System",
        message: "Game started! Good luck!",
        timestamp: Date.now(),
      };
      chatHistory.get(roomCode)?.push(startMsg);
      io.to(roomCode).emit("chatMessage", startMsg);
      logger.info({ roomCode }, "Game started");
    });

    socket.on(
      "playCard",
      ({ cardId, chosenColor }: { cardId: string; chosenColor?: CardColor }) => {
        const roomCode = playerRooms.get(socket.id);
        if (!roomCode) return;
        const state = rooms.get(roomCode);
        if (!state) return;

        const result = playCard(state, socket.id, cardId, chosenColor);
        if (!result.success) {
          socket.emit("error", { message: result.error });
          if (result.chooseColorNeeded) {
            socket.emit("chooseColor");
          }
          return;
        }

        rooms.set(roomCode, result.nextState);
        broadcastGameState(io, roomCode);

        if (result.nextState.winner) {
          const winner = result.nextState.players.find(
            (p) => p.id === result.nextState.winner
          );
          io.to(roomCode).emit("gameOver", {
            winnerId: result.nextState.winner,
            winnerName: winner?.username,
          });
          const winMsg: ChatMessage = {
            playerId: "system",
            username: "System",
            message: `${winner?.username} wins the game! UNO!`,
            timestamp: Date.now(),
          };
          chatHistory.get(roomCode)?.push(winMsg);
          io.to(roomCode).emit("chatMessage", winMsg);
        }
      }
    );

    socket.on("drawCard", () => {
      const roomCode = playerRooms.get(socket.id);
      if (!roomCode) return;
      const state = rooms.get(roomCode);
      if (!state) return;

      const result = drawFromDeck(state, socket.id);
      if (!result.success) {
        socket.emit("error", { message: result.error });
        return;
      }

      rooms.set(roomCode, result.nextState);
      broadcastGameState(io, roomCode);
    });

    socket.on("sendChat", ({ message }: { message: string }) => {
      const roomCode = playerRooms.get(socket.id);
      if (!roomCode) return;
      const state = rooms.get(roomCode);
      if (!state) return;

      const player = state.players.find((p) => p.id === socket.id);
      if (!player) return;

      const chatMsg: ChatMessage = {
        playerId: socket.id,
        username: player.username,
        message: message.trim().slice(0, 200),
        timestamp: Date.now(),
      };

      chatHistory.get(roomCode)?.push(chatMsg);
      io.to(roomCode).emit("chatMessage", chatMsg);
    });

    socket.on("getChatHistory", () => {
      const roomCode = playerRooms.get(socket.id);
      if (!roomCode) return;
      const history = chatHistory.get(roomCode) || [];
      socket.emit("chatHistory", history);
    });

    socket.on("playAgain", () => {
      const roomCode = playerRooms.get(socket.id);
      if (!roomCode) return;
      const state = rooms.get(roomCode);
      if (!state) return;
      if (state.players[0].id !== socket.id) {
        socket.emit("error", { message: "Only the host can restart" });
        return;
      }

      const newState = createGame(roomCode);
      newState.players = state.players.map((p) => ({
        ...p,
        hand: [],
      }));
      newState.gameStarted = true;
      dealInitialCards(newState);
      rooms.set(roomCode, newState);
      broadcastGameState(io, roomCode);

      const restartMsg: ChatMessage = {
        playerId: "system",
        username: "System",
        message: "New game started!",
        timestamp: Date.now(),
      };
      chatHistory.get(roomCode)?.push(restartMsg);
      io.to(roomCode).emit("chatMessage", restartMsg);
    });

    socket.on("disconnect", () => {
      const roomCode = playerRooms.get(socket.id);
      if (roomCode) {
        const state = rooms.get(roomCode);
        if (state) {
          const player = state.players.find((p) => p.id === socket.id);
          if (player) {
            player.isConnected = false;
            const disconnectMsg: ChatMessage = {
              playerId: "system",
              username: "System",
              message: `${player.username} disconnected`,
              timestamp: Date.now(),
            };
            chatHistory.get(roomCode)?.push(disconnectMsg);
            io.to(roomCode).emit("chatMessage", disconnectMsg);
            broadcastGameState(io, roomCode);
          }
        }
        playerRooms.delete(socket.id);
      }
      logger.info({ socketId: socket.id }, "Socket disconnected");
    });
  });
}
