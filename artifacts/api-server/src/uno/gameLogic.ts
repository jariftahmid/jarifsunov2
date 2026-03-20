export type CardColor = "red" | "green" | "blue" | "yellow" | "wild";
export type CardValue =
  | "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9"
  | "skip" | "reverse" | "draw2" | "wild" | "wild4";

export interface Card {
  id: string;
  color: CardColor;
  value: CardValue;
}

export interface Player {
  id: string;
  username: string;
  hand: Card[];
  isConnected: boolean;
}

export interface GameState {
  roomCode: string;
  players: Player[];
  deck: Card[];
  discardPile: Card[];
  currentPlayerIndex: number;
  direction: 1 | -1;
  gameStarted: boolean;
  winner: string | null;
  pendingDrawCount: number;
  currentColor: CardColor;
  lastAction: string;
}

export interface ChatMessage {
  playerId: string;
  username: string;
  message: string;
  timestamp: number;
}

function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

function createDeck(): Card[] {
  const colors: CardColor[] = ["red", "green", "blue", "yellow"];
  const deck: Card[] = [];

  for (const color of colors) {
    deck.push({ id: generateId(), color, value: "0" });
    for (let n = 1; n <= 9; n++) {
      const v = String(n) as CardValue;
      deck.push({ id: generateId(), color, value: v });
      deck.push({ id: generateId(), color, value: v });
    }
    const actions: CardValue[] = ["skip", "reverse", "draw2"];
    for (const action of actions) {
      deck.push({ id: generateId(), color, value: action });
      deck.push({ id: generateId(), color, value: action });
    }
  }

  for (let i = 0; i < 4; i++) {
    deck.push({ id: generateId(), color: "wild", value: "wild" });
    deck.push({ id: generateId(), color: "wild", value: "wild4" });
  }

  return shuffle(deck);
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function createGame(roomCode: string): GameState {
  const deck = createDeck();
  return {
    roomCode,
    players: [],
    deck,
    discardPile: [],
    currentPlayerIndex: 0,
    direction: 1,
    gameStarted: false,
    winner: null,
    pendingDrawCount: 0,
    currentColor: "wild",
    lastAction: "",
  };
}

export function drawCard(state: GameState): Card {
  if (state.deck.length === 0) {
    const top = state.discardPile.pop()!;
    state.deck = shuffle(state.discardPile);
    state.discardPile = [top];
  }
  return state.deck.pop()!;
}

export function dealInitialCards(state: GameState): void {
  for (let i = 0; i < 7; i++) {
    for (const player of state.players) {
      player.hand.push(drawCard(state));
    }
  }

  let topCard = drawCard(state);
  while (topCard.value === "wild4") {
    state.deck.unshift(topCard);
    topCard = drawCard(state);
  }
  state.discardPile.push(topCard);
  state.currentColor = topCard.color;

  if (topCard.value === "skip") {
    state.currentPlayerIndex = getNextPlayerIndex(state);
  } else if (topCard.value === "reverse") {
    state.direction = -1;
    if (state.players.length === 2) {
      state.currentPlayerIndex = getNextPlayerIndex(state);
    }
  } else if (topCard.value === "draw2") {
    state.pendingDrawCount = 2;
  }
}

export function getNextPlayerIndex(state: GameState, skip = false): number {
  const count = state.players.length;
  let next = (state.currentPlayerIndex + state.direction + count) % count;
  if (skip) {
    next = (next + state.direction + count) % count;
  }
  return next;
}

export function canPlayCard(card: Card, state: GameState): boolean {
  const top = state.discardPile[state.discardPile.length - 1];
  if (!top) return true;
  if (card.color === "wild") return true;
  if (card.color === state.currentColor) return true;
  if (card.value === top.value) return true;
  return false;
}

export interface PlayResult {
  success: boolean;
  error?: string;
  nextState: GameState;
  chooseColorNeeded?: boolean;
}

export function playCard(
  state: GameState,
  playerId: string,
  cardId: string,
  chosenColor?: CardColor
): PlayResult {
  const playerIndex = state.players.findIndex((p) => p.id === playerId);
  if (playerIndex !== state.currentPlayerIndex) {
    return { success: false, error: "Not your turn", nextState: state };
  }

  const player = state.players[playerIndex];
  const cardIndex = player.hand.findIndex((c) => c.id === cardId);
  if (cardIndex === -1) {
    return { success: false, error: "Card not in hand", nextState: state };
  }

  const card = player.hand[cardIndex];

  if (!canPlayCard(card, state)) {
    return { success: false, error: "Cannot play that card", nextState: state };
  }

  if ((card.value === "wild" || card.value === "wild4") && !chosenColor) {
    return {
      success: false,
      error: "Choose a color",
      nextState: state,
      chooseColorNeeded: true,
    };
  }

  player.hand.splice(cardIndex, 1);
  state.discardPile.push(card);
  state.currentColor = card.color === "wild" ? (chosenColor || "red") : card.color;

  const username = player.username;
  state.lastAction = `${username} played ${card.color} ${card.value}`;

  if (player.hand.length === 0) {
    state.winner = playerId;
    return { success: true, nextState: state };
  }

  if (card.value === "skip") {
    state.currentPlayerIndex = getNextPlayerIndex(state, true);
    state.lastAction += " (next player skipped)";
  } else if (card.value === "reverse") {
    state.direction = (state.direction * -1) as 1 | -1;
    if (state.players.length === 2) {
      state.currentPlayerIndex = getNextPlayerIndex(state);
    } else {
      state.currentPlayerIndex = getNextPlayerIndex(state);
    }
    state.lastAction += " (direction reversed)";
  } else if (card.value === "draw2") {
    const next = getNextPlayerIndex(state);
    const nextPlayer = state.players[next];
    nextPlayer.hand.push(drawCard(state));
    nextPlayer.hand.push(drawCard(state));
    state.currentPlayerIndex = getNextPlayerIndex(state, true);
    state.lastAction += ` (${nextPlayer.username} draws 2)`;
  } else if (card.value === "wild4") {
    const next = getNextPlayerIndex(state);
    const nextPlayer = state.players[next];
    nextPlayer.hand.push(drawCard(state));
    nextPlayer.hand.push(drawCard(state));
    nextPlayer.hand.push(drawCard(state));
    nextPlayer.hand.push(drawCard(state));
    state.currentPlayerIndex = getNextPlayerIndex(state, true);
    state.lastAction += ` (${nextPlayer.username} draws 4, color: ${chosenColor})`;
  } else {
    state.currentPlayerIndex = getNextPlayerIndex(state);
  }

  return { success: true, nextState: state };
}

export function drawFromDeck(state: GameState, playerId: string): PlayResult {
  const playerIndex = state.players.findIndex((p) => p.id === playerId);
  if (playerIndex !== state.currentPlayerIndex) {
    return { success: false, error: "Not your turn", nextState: state };
  }

  const card = drawCard(state);
  state.players[playerIndex].hand.push(card);
  state.lastAction = `${state.players[playerIndex].username} drew a card`;
  state.currentPlayerIndex = getNextPlayerIndex(state);

  return { success: true, nextState: state };
}

export function getPublicState(state: GameState, forPlayerId: string) {
  return {
    roomCode: state.roomCode,
    players: state.players.map((p) => ({
      id: p.id,
      username: p.username,
      cardCount: p.hand.length,
      isConnected: p.isConnected,
      hand: p.id === forPlayerId ? p.hand : undefined,
    })),
    topCard: state.discardPile[state.discardPile.length - 1] || null,
    currentColor: state.currentColor,
    currentPlayerIndex: state.currentPlayerIndex,
    direction: state.direction,
    gameStarted: state.gameStarted,
    winner: state.winner,
    deckCount: state.deck.length,
    lastAction: state.lastAction,
  };
}
