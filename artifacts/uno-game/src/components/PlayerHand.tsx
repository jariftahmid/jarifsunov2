import { motion, AnimatePresence } from "framer-motion";
import { Card } from "../types/uno";
import { UnoCard } from "./UnoCard";

interface PlayerHandProps {
  cards: Card[];
  playableCardIds: Set<string>;
  onPlayCard: (cardId: string) => void;
  isMyTurn: boolean;
}

export function PlayerHand({ cards, playableCardIds, onPlayCard, isMyTurn }: PlayerHandProps) {
  const maxSpread = Math.min(700, cards.length * 70);
  const cardWidth = 64;
  const overlap = cards.length > 1 ? Math.min(60, (maxSpread - cardWidth) / (cards.length - 1)) : 0;

  return (
    <div className="relative flex items-end justify-center w-full" style={{ height: "130px" }}>
      <AnimatePresence>
        {cards.map((card, i) => {
          const offset = cards.length === 1 ? 0 : (i - (cards.length - 1) / 2) * overlap;
          const rotation = cards.length === 1 ? 0 : (i - (cards.length - 1) / 2) * 2.5;
          const isPlayable = isMyTurn && playableCardIds.has(card.id);

          return (
            <motion.div
              key={card.id}
              initial={{ y: 100, opacity: 0 }}
              animate={{
                x: offset,
                rotate: rotation,
                y: 0,
                opacity: 1,
                zIndex: i,
              }}
              exit={{ y: 100, opacity: 0, scale: 0.8 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="absolute"
              style={{ transformOrigin: "bottom center" }}
            >
              <UnoCard
                card={card}
                playable={isPlayable}
                onClick={() => isPlayable && onPlayCard(card.id)}
              />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
