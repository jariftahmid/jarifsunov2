import { motion } from "framer-motion";
import { Card, CardColor } from "../types/uno";
import { cn } from "@/lib/utils";

const colorMap: Record<CardColor, string> = {
  red: "from-red-600 to-red-800 border-red-400",
  green: "from-green-600 to-green-800 border-green-400",
  blue: "from-blue-600 to-blue-800 border-blue-400",
  yellow: "from-yellow-500 to-yellow-700 border-yellow-300",
  wild: "from-purple-600 via-pink-600 to-orange-500 border-purple-400",
};

const colorGlow: Record<CardColor, string> = {
  red: "shadow-red-500/60",
  green: "shadow-green-500/60",
  blue: "shadow-blue-500/60",
  yellow: "shadow-yellow-400/60",
  wild: "shadow-purple-500/60",
};

function getDisplayValue(value: string): string {
  switch (value) {
    case "skip": return "⊘";
    case "reverse": return "⇄";
    case "draw2": return "+2";
    case "wild": return "★";
    case "wild4": return "+4";
    default: return value;
  }
}

interface UnoCardProps {
  card: Card;
  playable?: boolean;
  onClick?: () => void;
  small?: boolean;
  faceDown?: boolean;
}

export function UnoCard({ card, playable, onClick, small, faceDown }: UnoCardProps) {
  if (faceDown) {
    return (
      <div
        className={cn(
          "rounded-xl border-2 border-white/20 bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center select-none",
          small ? "w-10 h-14" : "w-16 h-24"
        )}
        style={{ boxShadow: "0 10px 20px rgba(0,0,0,0.3)" }}
      >
        <div className="rounded-lg border border-white/20 w-3/4 h-3/4 flex items-center justify-center">
          <span className="text-white font-black text-xs">UNO</span>
        </div>
      </div>
    );
  }

  const displayValue = getDisplayValue(card.value);
  const isAction = ["skip", "reverse", "draw2", "wild", "wild4"].includes(card.value);

  return (
    <motion.div
      whileHover={playable ? { y: -16, scale: 1.08, zIndex: 50 } : {}}
      whileTap={playable ? { scale: 0.95 } : {}}
      onClick={playable ? onClick : undefined}
      className={cn(
        "rounded-xl border-2 bg-gradient-to-br flex flex-col items-center justify-center select-none relative overflow-hidden",
        colorMap[card.color],
        small ? "w-10 h-14 cursor-default" : "w-16 h-24",
        playable ? "cursor-pointer" : "cursor-default",
        playable && `shadow-lg ${colorGlow[card.color]}`
      )}
      style={{ boxShadow: "0 10px 20px rgba(0,0,0,0.3)" }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none rounded-xl" />
      
      <span className={cn(
        "absolute top-1 left-1.5 font-black leading-none",
        small ? "text-xs" : "text-sm",
        "text-white drop-shadow"
      )}>
        {displayValue}
      </span>

      <span className={cn(
        "font-black text-white drop-shadow-lg",
        small ? "text-lg" : isAction ? "text-2xl" : "text-3xl"
      )}>
        {displayValue}
      </span>

      <span className={cn(
        "absolute bottom-1 right-1.5 font-black leading-none rotate-180",
        small ? "text-xs" : "text-sm",
        "text-white drop-shadow"
      )}>
        {displayValue}
      </span>

      {playable && (
        <div className="absolute inset-0 rounded-xl border border-white/40 pointer-events-none" />
      )}
    </motion.div>
  );
}

interface ColorPickerProps {
  onChoose: (color: CardColor) => void;
}

export function ColorPicker({ onChoose }: ColorPickerProps) {
  const colors: { color: CardColor; bg: string; label: string }[] = [
    { color: "red", bg: "bg-red-500 hover:bg-red-400", label: "Red" },
    { color: "green", bg: "bg-green-500 hover:bg-green-400", label: "Green" },
    { color: "blue", bg: "bg-blue-500 hover:bg-blue-400", label: "Blue" },
    { color: "yellow", bg: "bg-yellow-400 hover:bg-yellow-300", label: "Yellow" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed inset-0 flex items-center justify-center z-50 bg-black/60 backdrop-blur-sm"
    >
      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 flex flex-col items-center gap-4">
        <h2 className="text-white text-xl font-bold">Choose a color</h2>
        <div className="grid grid-cols-2 gap-4">
          {colors.map(({ color, bg, label }) => (
            <motion.button
              key={color}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onChoose(color)}
              className={cn(
                "w-20 h-20 rounded-2xl font-bold text-white text-sm shadow-lg",
                bg
              )}
            >
              {label}
            </motion.button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
