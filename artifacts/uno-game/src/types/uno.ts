export type CardColor = "red" | "green" | "blue" | "yellow" | "wild";
export type CardValue =
  | "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9"
  | "skip" | "reverse" | "draw2" | "wild" | "wild4";

export interface Card {
  id: string;
  color: CardColor;
  value: CardValue;
}

export interface PublicPlayer {
  id: string;
  username: string;
  cardCount: number;
  isConnected: boolean;
  hand?: Card[];
}

export interface PublicGameState {
  roomCode: string;
  players: PublicPlayer[];
  topCard: Card | null;
  currentColor: CardColor;
  currentPlayerIndex: number;
  direction: 1 | -1;
  gameStarted: boolean;
  winner: string | null;
  deckCount: number;
  lastAction: string;
}

export interface ChatMessage {
  playerId: string;
  username: string;
  message: string;
  timestamp: number;
}
