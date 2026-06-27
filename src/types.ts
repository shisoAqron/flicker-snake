export type Position = {
  x: number;
  y: number;
};

export type Direction = "up" | "down" | "left" | "right";

export type GameStatus = "ready" | "playing" | "gameOver";

export type GameState = {
  snake: Position[];
  direction: Direction | null;
  nextDirection: Direction | null;
  npcSnake: Position[];
  npcDirection: Direction | null;
  items: Position[];
  score: number;
  npcScore: number;
  status: GameStatus;
};
