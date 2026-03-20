import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PublicGameState, Card, CardColor, ChatMessage } from "../types/uno";
import { UnoCard, ColorPicker } from "../components/UnoCard";
import { PlayerHand } from "../components/PlayerHand";
import { ChatBox } from "../components/ChatBox";
import { ArrowLeft, ArrowRight, RefreshCw, MessageCircle, X } from "lucide-react";

interface GameBoardProps {
  gameState: PublicGameState;
  myId: string;
  chatMessages: ChatMessage[];
  onSendChat: (msg: string) => void;
  onPlayCard: (cardId: string, chosenColor?: CardColor) => void;
  onDrawCard: () => void;
  onPlayAgain: () => void;
  pendingWildCardId: string | null;
  setPendingWildCardId: (id: string | null) => void;
}

const colorBg: Record<CardColor, string> = {
  red: "bg-red-500/20 border-red-400/50 shadow-red-500/20",
  green: "bg-green-500/20 border-green-400/50 shadow-green-500/20",
  blue: "bg-blue-500/20 border-blue-400/50 shadow-blue-500/20",
  yellow: "bg-yellow-500/20 border-yellow-400/50 shadow-yellow-400/20",
  wild: "bg-purple-500/20 border-purple-400/50 shadow-purple-500/20",
};

export function GameBoard({
  gameState,
  myId,
  chatMessages,
  onSendChat,
  onPlayCard,
  onDrawCard,
  onPlayAgain,
  pendingWildCardId,
  setPendingWildCardId,
}: GameBoardProps) {
  const [chatOpen, setChatOpen] = useState(true);

  const me = gameState.players.find((p) => p.id === myId);
  const myHand = me?.hand || [];
  const isMyTurn = gameState.players[gameState.currentPlayerIndex]?.id === myId;
  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  const isHost = gameState.players[0]?.id === myId;

  const playableCardIds = new Set<string>();
  if (isMyTurn && gameState.topCard) {
    for (const card of myHand) {
      if (card.color === "wild") {
        playableCardIds.add(card.id);
      } else if (card.color === gameState.currentColor) {
        playableCardIds.add(card.id);
      } else if (card.value === gameState.topCard.value) {
        playableCardIds.add(card.id);
      }
    }
  }

  const handlePlayCard = (cardId: string) => {
    const card = myHand.find((c) => c.id === cardId);
    if (!card) return;
    if (card.value === "wild" || card.value === "wild4") {
      setPendingWildCardId(cardId);
    } else {
      onPlayCard(cardId);
    }
  };

  const handleColorChosen = (color: CardColor) => {
    if (pendingWildCardId) {
      onPlayCard(pendingWildCardId, color);
      setPendingWildCardId(null);
    }
  };

  const opponents = gameState.players.filter((p) => p.id !== myId);

  const colorDotMap: Record<CardColor, string> = {
    red: "bg-red-500",
    green: "bg-green-500",
    blue: "bg-blue-500",
    yellow: "bg-yellow-400",
    wild: "bg-purple-500",
  };

  return (
    <div className="h-screen flex flex-col relative overflow-hidden">
      <div className="animated-bg absolute inset-0 -z-10" />

      {pendingWildCardId && <ColorPicker onChoose={handleColorChosen} />}

      {gameState.winner && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center"
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="glass-card p-10 text-center max-w-sm"
          >
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-4xl font-black text-white mb-2">
              {gameState.winner === myId ? "You Win!" : `${gameState.players.find(p => p.id === gameState.winner)?.username} Wins!`}
            </h2>
            <p className="text-white/60 mb-6">
              {gameState.winner === myId ? "Congratulations!" : "Better luck next time!"}
            </p>
            {isHost && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onPlayAgain}
                className="flex items-center justify-center gap-2 bg-purple-500 hover:bg-purple-400 text-white font-bold px-6 py-3 rounded-xl mx-auto transition-all"
              >
                <RefreshCw size={18} />
                Play Again
              </motion.button>
            )}
            {!isHost && (
              <p className="text-white/40 text-sm">Waiting for host to restart...</p>
            )}
          </motion.div>
        </motion.div>
      )}

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 flex flex-col p-4 gap-3 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <div className={`glass-card px-4 py-2 border ${colorBg[gameState.currentColor]} shadow-lg`}>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${colorDotMap[gameState.currentColor]}`} />
                <span className="text-white text-sm font-medium capitalize">{gameState.currentColor}</span>
              </div>
            </div>

            <div className="glass-card px-4 py-2 flex items-center gap-2">
              {gameState.direction === 1 ? <ArrowRight size={16} className="text-purple-400" /> : <ArrowLeft size={16} className="text-purple-400" />}
              <span className="text-white/60 text-sm">{gameState.direction === 1 ? "Clockwise" : "Counter"}</span>
            </div>

            <div className="glass-card px-4 py-2 flex-1 min-w-0">
              <p className="text-white/60 text-xs truncate">{gameState.lastAction || "Game in progress"}</p>
            </div>
          </div>

          <div className="flex items-center justify-around gap-4 flex-wrap">
            {opponents.map((opp) => {
              const isCurrentPlayer = gameState.players[gameState.currentPlayerIndex]?.id === opp.id;
              return (
                <motion.div
                  key={opp.id}
                  animate={isCurrentPlayer ? { scale: [1, 1.05, 1] } : {}}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className={`glass-card px-4 py-3 flex items-center gap-3 ${isCurrentPlayer ? "border-yellow-400/50 bg-yellow-500/10" : ""}`}
                >
                  <div className={`w-2 h-2 rounded-full ${opp.isConnected ? "bg-green-400" : "bg-red-400"}`} />
                  <div className="flex flex-col">
                    <span className="text-white text-sm font-semibold">{opp.username}</span>
                    <span className="text-white/50 text-xs">{opp.cardCount} cards</span>
                  </div>
                  <div className="flex gap-0.5">
                    {Array.from({ length: Math.min(opp.cardCount, 10) }).map((_, i) => (
                      <div key={i} className="w-4 h-6 rounded bg-white/10 border border-white/20" />
                    ))}
                    {opp.cardCount > 10 && <span className="text-white/50 text-xs self-center ml-1">+{opp.cardCount - 10}</span>}
                  </div>
                  {opp.cardCount === 1 && (
                    <span className="bg-red-500 text-white text-xs font-black px-2 py-0.5 rounded-full animate-pulse">UNO!</span>
                  )}
                </motion.div>
              );
            })}
          </div>

          <div className="flex-1 flex items-center justify-center gap-12">
            <motion.div
              whileHover={{ scale: isMyTurn ? 1.05 : 1 }}
              whileTap={isMyTurn ? { scale: 0.95 } : {}}
              onClick={isMyTurn ? onDrawCard : undefined}
              className={`relative ${isMyTurn ? "cursor-pointer" : "cursor-default"}`}
            >
              <div className="flex">
                {[2, 1, 0].map((offset) => (
                  <div
                    key={offset}
                    style={{ boxShadow: "0 10px 20px rgba(0,0,0,0.3)", marginLeft: offset > 0 ? "-40px" : 0 }}
                    className="rounded-xl border-2 border-white/20 bg-gradient-to-br from-slate-700 to-slate-900 w-16 h-24 flex items-center justify-center"
                  >
                    <span className="text-white font-black text-xs">UNO</span>
                  </div>
                ))}
              </div>
              <p className="text-white/50 text-xs text-center mt-2">{gameState.deckCount} cards</p>
              {isMyTurn && (
                <p className="text-yellow-300 text-xs text-center font-medium animate-pulse">Click to draw</p>
              )}
            </motion.div>

            <div className="flex flex-col items-center gap-2">
              {gameState.topCard && (
                <motion.div
                  key={gameState.topCard.id}
                  initial={{ scale: 0.5, rotate: -30, opacity: 0 }}
                  animate={{ scale: 1, rotate: 0, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                >
                  <UnoCard card={gameState.topCard} />
                </motion.div>
              )}
              <p className="text-white/50 text-xs">Discard Pile</p>
            </div>
          </div>

          <div className="flex flex-col items-center gap-2 pb-2">
            {isMyTurn && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-yellow-400/20 border border-yellow-400/50 rounded-full px-4 py-1.5"
              >
                <span className="text-yellow-300 font-semibold text-sm">Your Turn!</span>
              </motion.div>
            )}
            {!isMyTurn && currentPlayer && (
              <p className="text-white/50 text-sm">{currentPlayer.username}'s turn</p>
            )}
            {myHand.length === 1 && (
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 0.8 }}
                className="bg-red-500/80 border border-red-400 rounded-full px-4 py-1.5"
              >
                <span className="text-white font-black text-sm">UNO!</span>
              </motion.div>
            )}
            <PlayerHand
              cards={myHand}
              playableCardIds={playableCardIds}
              onPlayCard={handlePlayCard}
              isMyTurn={isMyTurn}
            />
            <p className="text-white/40 text-xs">{myHand.length} cards in hand</p>
          </div>
        </div>

        <div className={`transition-all duration-300 ${chatOpen ? "w-72" : "w-0"} flex-shrink-0`}>
          {chatOpen && (
            <div className="h-full p-3 pl-0 flex flex-col">
              <div className="flex items-center justify-between mb-2 px-1">
                <button onClick={() => setChatOpen(false)} className="text-white/30 hover:text-white/60 transition-colors">
                  <X size={16} />
                </button>
              </div>
              <div className="flex-1 min-h-0">
                <ChatBox messages={chatMessages} onSend={onSendChat} myId={myId} />
              </div>
            </div>
          )}
        </div>

        {!chatOpen && (
          <button
            onClick={() => setChatOpen(true)}
            className="absolute right-4 top-4 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl p-3 text-white transition-all z-10"
          >
            <MessageCircle size={18} />
          </button>
        )}
      </div>
    </div>
  );
}
