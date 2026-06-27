export type Position = {
  x: number;
  y: number;
};

export type Direction = "up" | "down" | "left" | "right";

export type GameStatus = "ready" | "playing" | "gameOver";

export type GameResult = "player" | "npc" | "draw" | null;

export type GameState = {
  snake: Position[];
  direction: Direction | null;
  nextDirection: Direction | null;
  npcSnake: Position[];
  npcDirection: Direction | null;
  items: Position[];
  score: number;
  npcScore: number;
  timeLeft: number;   // VS モード: 残り秒数 (60→0)、solo では 0
  result: GameResult; // 時間切れ or 衝突時の勝敗
  status: GameStatus;
};
