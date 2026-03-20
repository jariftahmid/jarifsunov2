import { motion } from "framer-motion";
import { PublicGameState } from "../types/uno";
import { Users, Copy, Play, Wifi, WifiOff } from "lucide-react";
import { useState } from "react";
import { ChatBox } from "../components/ChatBox";
import { ChatMessage } from "../types/uno";

interface WaitingRoomProps {
  gameState: PublicGameState;
  myId: string;
  chatMessages: ChatMessage[];
  onSendChat: (msg: string) => void;
  onStartGame: () => void;
}

export function WaitingRoom({ gameState, myId, chatMessages, onSendChat, onStartGame }: WaitingRoomProps) {
  const [copied, setCopied] = useState(false);
  const isHost = gameState.players[0]?.id === myId;
  const canStart = gameState.players.length >= 2;

  const copyCode = () => {
    navigator.clipboard.writeText(gameState.roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative p-4">
      <div className="animated-bg absolute inset-0 -z-10" />

      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 flex flex-col gap-4">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6"
          >
            <h1 className="text-white font-black text-3xl mb-1">Waiting Room</h1>
            <p className="text-white/50 text-sm">Share the code with friends to join</p>

            <div className="mt-6 flex items-center gap-3">
              <div className="bg-white/10 border border-white/20 rounded-2xl px-8 py-4 flex-1 text-center">
                <p className="text-white/50 text-xs mb-1">Room Code</p>
                <span className="text-white font-black text-4xl tracking-widest">{gameState.roomCode}</span>
              </div>
              <button
                onClick={copyCode}
                className="bg-white/10 hover:bg-white/20 border border-white/20 rounded-2xl p-4 text-white transition-all"
                title="Copy room code"
              >
                <Copy size={20} />
              </button>
            </div>
            {copied && <p className="text-green-400 text-xs text-center mt-2">Copied to clipboard!</p>}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card p-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <Users size={18} className="text-purple-400" />
              <h2 className="text-white font-semibold">Players ({gameState.players.length}/4)</h2>
            </div>

            <div className="flex flex-col gap-3">
              {gameState.players.map((player, i) => (
                <motion.div
                  key={player.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 ${
                    player.id === myId
                      ? "bg-purple-500/20 border border-purple-400/30"
                      : "bg-white/5 border border-white/10"
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full ${player.isConnected ? "bg-green-400" : "bg-red-400"}`} />
                  <span className="text-white font-medium flex-1">{player.username}</span>
                  {i === 0 && (
                    <span className="bg-purple-500/30 border border-purple-400/30 text-purple-300 text-xs px-2 py-0.5 rounded-full">
                      Host
                    </span>
                  )}
                  {player.id === myId && (
                    <span className="text-white/40 text-xs">You</span>
                  )}
                </motion.div>
              ))}

              {Array.from({ length: 4 - gameState.players.length }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 rounded-xl px-4 py-3 bg-white/5 border border-white/10 border-dashed opacity-40">
                  <div className="w-2 h-2 rounded-full bg-white/20" />
                  <span className="text-white/40 text-sm">Waiting for player...</span>
                </div>
              ))}
            </div>

            {isHost && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onStartGame}
                disabled={!canStart}
                className="w-full mt-6 flex items-center justify-center gap-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl px-6 py-4 text-white font-bold text-lg transition-all shadow-lg"
              >
                <Play size={20} />
                {canStart ? "Start Game!" : "Need 2+ players"}
              </motion.button>
            )}

            {!isHost && (
              <p className="text-white/40 text-center text-sm mt-4">Waiting for host to start the game...</p>
            )}
          </motion.div>
        </div>

        <div className="h-80 md:h-auto">
          <ChatBox messages={chatMessages} onSend={onSendChat} myId={myId} />
        </div>
      </div>
    </div>
  );
}
