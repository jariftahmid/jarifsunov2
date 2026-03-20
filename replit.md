# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5 + Socket.io
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   ├── api-server/         # Express API server + Socket.io game server
│   └── uno-game/           # React + Vite multiplayer Uno frontend
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts (single workspace package)
│   └── src/                # Individual .ts scripts
├── pnpm-workspace.yaml     # pnpm workspace
├── tsconfig.base.json      # Shared TS options
├── tsconfig.json           # Root TS project references
└── package.json            # Root package with hoisted devDeps
```

## Applications

### `artifacts/uno-game` (`@workspace/uno-game`)

React + Vite multiplayer Uno card game. Features:
- Lobby with Create Room / Join Room via 4-letter code
- Real-time multiplayer via Socket.io (2-4 players)
- Full Uno game rules: number cards, skip, reverse, draw2, wild, wild4
- Dark glassmorphism UI with animated mesh gradient background
- Framer Motion card animations with hover fan effects
- In-game chat box
- Color picker for wild cards
- Win detection and play again

### `artifacts/api-server` (`@workspace/api-server`)

Express 5 API server with Socket.io for real-time Uno multiplayer.

- `src/uno/gameLogic.ts` — pure Uno game logic (deck creation, card playing, turn management)
- `src/uno/socketHandler.ts` — Socket.io events (createRoom, joinRoom, startGame, playCard, drawCard, sendChat)
- Socket.io served at `/api/socket.io`
- In-memory room state (no DB required for game sessions)

## Socket Events

### Client → Server
- `createRoom { username }` — create a new room
- `joinRoom { username, roomCode }` — join existing room
- `startGame` — host starts the game
- `playCard { cardId, chosenColor? }` — play a card
- `drawCard` — draw from deck
- `sendChat { message }` — send chat message
- `getChatHistory` — request chat history
- `playAgain` — host restarts the game

### Server → Client
- `roomCreated { roomCode }`
- `roomJoined { roomCode }`
- `gameState` — full game state for that player
- `chatMessage` — single chat message
- `chatHistory` — array of past messages
- `gameOver { winnerId, winnerName }`
- `error { message }`

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references.

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages that define it
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly` using project references
