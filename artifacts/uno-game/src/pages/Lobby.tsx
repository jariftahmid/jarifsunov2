import { useState } from "react";
import { motion } from "framer-motion";
import { Gamepad2, Users, Plus, LogIn } from "lucide-react";

interface LobbyProps {
  onCreateRoom: (username: string) => void;
  onJoinRoom: (username: string, roomCode: string) => void;
  error: string | null;
}

export function Lobby({ onCreateRoom, onJoinRoom, error }: LobbyProps) {
  const [username, setUsername] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [mode, setMode] = useState<"menu" | "create" | "join">("menu");

  const handleCreate = () => {
    if (!username.trim()) return;
    onCreateRoom(username.trim());
  };

  const handleJoin = () => {
    if (!username.trim() || !roomCode.trim()) return;
    onJoinRoom(username.trim(), roomCode.trim().toUpperCase());
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
      <div className="animated-bg absolute inset-0 -z-10" />

      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12 text-center"
      >
        <h1 className="text-7xl font-black text-white tracking-wider drop-shadow-2xl"
          style={{ textShadow: "0 0 40px rgba(168,85,247,0.8), 0 4px 20px rgba(0,0,0,0.5)" }}>
          UNO
        </h1>
        <p className="text-white/60 mt-2 text-lg">Multiplayer Card Game</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="glass-card w-full max-w-md p-8 flex flex-col gap-6"
      >
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-red-500/20 border border-red-400/30 rounded-xl px-4 py-3 text-red-300 text-sm"
          >
            {error}
          </motion.div>
        )}

        <div className="flex flex-col gap-2">
          <label className="text-white/70 text-sm font-medium">Your Name</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your username..."
            className="bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-purple-400/60 focus:bg-white/15 transition-all"
            maxLength={20}
          />
        </div>

        {mode === "menu" && (
          <div className="flex flex-col gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setMode("create")}
              className="flex items-center justify-center gap-3 bg-purple-500/80 hover:bg-purple-500 border border-purple-400/30 rounded-xl px-6 py-4 text-white font-semibold transition-all"
            >
              <Plus size={20} />
              Create Room
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setMode("join")}
              className="flex items-center justify-center gap-3 bg-white/10 hover:bg-white/15 border border-white/20 rounded-xl px-6 py-4 text-white font-semibold transition-all"
            >
              <LogIn size={20} />
              Join Room
            </motion.button>
          </div>
        )}

        {mode === "create" && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col gap-3"
          >
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-white/60 text-sm text-center">
              <Users size={20} className="mx-auto mb-2 text-purple-400" />
              A 4-letter room code will be generated for others to join
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleCreate}
              disabled={!username.trim()}
              className="flex items-center justify-center gap-3 bg-purple-500/80 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed border border-purple-400/30 rounded-xl px-6 py-4 text-white font-semibold transition-all"
            >
              <Gamepad2 size={20} />
              Create Room
            </motion.button>
            <button onClick={() => setMode("menu")} className="text-white/40 hover:text-white/60 text-sm transition-colors">
              ← Back
            </button>
          </motion.div>
        )}

        {mode === "join" && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col gap-3"
          >
            <div className="flex flex-col gap-2">
              <label className="text-white/70 text-sm font-medium">Room Code</label>
              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="Enter 4-letter code..."
                className="bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-purple-400/60 focus:bg-white/15 transition-all tracking-widest text-center text-xl font-bold uppercase"
                maxLength={4}
              />
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleJoin}
              disabled={!username.trim() || roomCode.length !== 4}
              className="flex items-center justify-center gap-3 bg-purple-500/80 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed border border-purple-400/30 rounded-xl px-6 py-4 text-white font-semibold transition-all"
            >
              <LogIn size={20} />
              Join Room
            </motion.button>
            <button onClick={() => setMode("menu")} className="text-white/40 hover:text-white/60 text-sm transition-colors">
              ← Back
            </button>
          </motion.div>
        )}
      </motion.div>

      <p className="mt-6 text-white/20 text-xs">2-4 players per room</p>
    </div>
  );
}
