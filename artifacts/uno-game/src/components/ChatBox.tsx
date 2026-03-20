import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { ChatMessage } from "../types/uno";
import { Send } from "lucide-react";

interface ChatBoxProps {
  messages: ChatMessage[];
  onSend: (message: string) => void;
  myId: string;
}

export function ChatBox({ messages, onSend, myId }: ChatBoxProps) {
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setInput("");
  };

  return (
    <div className="flex flex-col h-full bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden">
      <div className="px-4 py-3 border-b border-white/10">
        <h3 className="text-white font-semibold text-sm">Chat</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
        {messages.length === 0 && (
          <p className="text-white/30 text-xs text-center mt-4">No messages yet</p>
        )}
        {messages.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex flex-col ${msg.playerId === myId ? "items-end" : "items-start"}`}
          >
            {msg.playerId === "system" ? (
              <div className="bg-white/10 rounded-lg px-3 py-1 max-w-full">
                <span className="text-white/50 text-xs italic">{msg.message}</span>
              </div>
            ) : (
              <div className={`max-w-[85%] ${msg.playerId === myId ? "items-end" : "items-start"} flex flex-col gap-0.5`}>
                <span className="text-white/40 text-xs px-1">{msg.username}</span>
                <div className={`rounded-2xl px-3 py-1.5 ${
                  msg.playerId === myId
                    ? "bg-purple-500/80 text-white"
                    : "bg-white/10 text-white/90"
                }`}>
                  <span className="text-sm break-words">{msg.message}</span>
                </div>
              </div>
            )}
          </motion.div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="p-3 border-t border-white/10 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Say something..."
          className="flex-1 bg-white/10 border border-white/10 rounded-xl px-3 py-2 text-white placeholder-white/30 text-sm focus:outline-none focus:border-white/30"
          maxLength={200}
        />
        <button
          onClick={handleSend}
          className="bg-purple-500 hover:bg-purple-400 text-white rounded-xl p-2 transition-colors"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}
