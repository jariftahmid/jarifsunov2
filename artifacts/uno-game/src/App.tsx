import { useState, useEffect, useCallback } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { getSocket } from "./lib/socket";
import { Lobby } from "./pages/Lobby";
import { WaitingRoom } from "./pages/WaitingRoom";
import { GameBoard } from "./pages/GameBoard";
import { PublicGameState, ChatMessage, CardColor } from "./types/uno";

const queryClient = new QueryClient();

type AppPhase = "lobby" | "waiting" | "playing";

function App() {
  const [phase, setPhase] = useState<AppPhase>("lobby");
  const [gameState, setGameState] = useState<PublicGameState | null>(null);
  const [myId, setMyId] = useState<string>("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pendingWildCardId, setPendingWildCardId] = useState<string | null>(null);

  useEffect(() => {
    const socket = getSocket();

    socket.on("connect", () => {
      setMyId(socket.id || "");
    });

    socket.on("roomCreated", () => {
      setPhase("waiting");
      setError(null);
    });

    socket.on("roomJoined", () => {
      setPhase("waiting");
      setError(null);
    });

    socket.on("gameState", (state: PublicGameState) => {
      setGameState(state);
      if (state.gameStarted) {
        setPhase("playing");
      }
    });

    socket.on("chatMessage", (msg: ChatMessage) => {
      setChatMessages((prev) => [...prev, msg]);
    });

    socket.on("chatHistory", (history: ChatMessage[]) => {
      setChatMessages(history);
    });

    socket.on("error", ({ message }: { message: string }) => {
      setError(message);
      setTimeout(() => setError(null), 4000);
    });

    socket.on("chooseColor", () => {
      // handled by pendingWildCardId in GameBoard
    });

    return () => {
      socket.off("connect");
      socket.off("roomCreated");
      socket.off("roomJoined");
      socket.off("gameState");
      socket.off("chatMessage");
      socket.off("chatHistory");
      socket.off("error");
      socket.off("chooseColor");
    };
  }, []);

  const handleCreateRoom = useCallback((username: string) => {
    const socket = getSocket();
    const doCreate = () => {
      setMyId(socket.id || "");
      socket.emit("createRoom", { username });
    };
    if (socket.connected) {
      doCreate();
    } else {
      socket.once("connect", doCreate);
      socket.connect();
    }
  }, []);

  const handleJoinRoom = useCallback((username: string, roomCode: string) => {
    const socket = getSocket();
    const doJoin = () => {
      setMyId(socket.id || "");
      socket.emit("joinRoom", { username, roomCode });
      socket.emit("getChatHistory");
    };
    if (socket.connected) {
      doJoin();
    } else {
      socket.once("connect", doJoin);
      socket.connect();
    }
  }, []);

  const handleStartGame = useCallback(() => {
    const socket = getSocket();
    socket.emit("startGame");
  }, []);

  const handlePlayCard = useCallback((cardId: string, chosenColor?: CardColor) => {
    const socket = getSocket();
    socket.emit("playCard", { cardId, chosenColor });
  }, []);

  const handleDrawCard = useCallback(() => {
    const socket = getSocket();
    socket.emit("drawCard");
  }, []);

  const handleSendChat = useCallback((message: string) => {
    const socket = getSocket();
    socket.emit("sendChat", { message });
  }, []);

  const handlePlayAgain = useCallback(() => {
    const socket = getSocket();
    socket.emit("playAgain");
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {error && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] bg-red-500/90 text-white px-6 py-3 rounded-xl text-sm shadow-xl animate-in fade-in slide-in-from-top-2">
          {error}
        </div>
      )}
      {phase === "lobby" && (
        <Lobby
          onCreateRoom={handleCreateRoom}
          onJoinRoom={handleJoinRoom}
          error={null}
        />
      )}
      {phase === "waiting" && gameState && (
        <WaitingRoom
          gameState={gameState}
          myId={myId}
          chatMessages={chatMessages}
          onSendChat={handleSendChat}
          onStartGame={handleStartGame}
        />
      )}
      {phase === "playing" && gameState && (
        <GameBoard
          gameState={gameState}
          myId={myId}
          chatMessages={chatMessages}
          onSendChat={handleSendChat}
          onPlayCard={handlePlayCard}
          onDrawCard={handleDrawCard}
          onPlayAgain={handlePlayAgain}
          pendingWildCardId={pendingWildCardId}
          setPendingWildCardId={setPendingWildCardId}
        />
      )}
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
