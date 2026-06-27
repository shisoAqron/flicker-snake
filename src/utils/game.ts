import type { Direction, Position } from "../types";
import { BOARD_SIZE, containsPosition, positionEquals } from "./position";

export const MOVE_INTERVAL_MS = 150;
export const MOVE_INTERVAL_MIN_MS = 10;
export const ITEM_SPAWN_INTERVAL_MS = 2000;
export const ITEM_SPAWN_INTERVAL_VS_MS = 1000;
export const getMoveInterval = (snakeLength: number): number =>
  Math.max(MOVE_INTERVAL_MIN_MS, MOVE_INTERVAL_MS - Math.floor(snakeLength / 10) * 20);
export const MAX_ITEMS = 3;
export const MAX_ITEMS_VS = 4;
export const MIN_SWIPE_DISTANCE = 30;

export const initialSnake: Position[] = [{ x: 10, y: 10 }];

export const isOppositeDirection = (
  current: Direction,
  next: Direction
): boolean =>
  (current === "up" && next === "down") ||
  (current === "down" && next === "up") ||
  (current === "left" && next === "right") ||
  (current === "right" && next === "left");

export const getNextHead = (head: Position, direction: Direction): Position => {
  switch (direction) {
    case "up":
      return { x: head.x, y: head.y - 1 };
    case "down":
      return { x: head.x, y: head.y + 1 };
    case "left":
      return { x: head.x - 1, y: head.y };
    case "right":
      return { x: head.x + 1, y: head.y };
  }
};

export const getRandomEmptyPosition = (
  snake: Position[],
  items: Position[]
): Position | null => {
  const occupied = new Set(
    [...snake, ...items].map((p) => `${p.x},${p.y}`)
  );

  const empty: Position[] = [];
  for (let y = 0; y < BOARD_SIZE; y++) {
    for (let x = 0; x < BOARD_SIZE; x++) {
      if (!occupied.has(`${x},${y}`)) {
        empty.push({ x, y });
      }
    }
  }

  if (empty.length === 0) return null;
  return empty[Math.floor(Math.random() * empty.length)];
};

export const generateInitialItems = (snake: Position[]): Position[] => {
  const count = Math.floor(Math.random() * 3) + 1; // 1〜3個
  const items: Position[] = [];
  for (let i = 0; i < count; i++) {
    const pos = getRandomEmptyPosition(snake, items);
    if (pos) items.push(pos);
  }
  return items;
};

export const detectSwipeDirection = (
  start: { x: number; y: number },
  end: { x: number; y: number }
): Direction | null => {
  const dx = end.x - start.x;
  const dy = end.y - start.y;

  if (
    Math.abs(dx) < MIN_SWIPE_DISTANCE &&
    Math.abs(dy) < MIN_SWIPE_DISTANCE
  ) {
    return null;
  }

  if (Math.abs(dx) > Math.abs(dy)) {
    return dx > 0 ? "right" : "left";
  }

  return dy > 0 ? "down" : "up";
};

export const isSelfCollision = (
  head: Position,
  snake: Position[],
  ate: boolean
): boolean => {
  // 通常移動時は末尾（最後の要素）は除外（移動後に消える）
  const body = ate ? snake : snake.slice(0, -1);
  return body.some((seg) => positionEquals(seg, head));
};

// ===== NPC =====

export const initialNPCSnake: Position[] = [{ x: 10, y: 4 }];

/**
 * BFS フラッドフィル: start から到達できるセル数を返す
 * obstacles に含まれるセルと盤外は通過不可
 */
const floodFill = (start: Position, obstacles: Position[]): number => {
  const obstacleSet = new Set(obstacles.map((p) => `${p.x},${p.y}`));
  const visited = new Set<string>();
  const queue: Position[] = [start];
  const allDirs: Direction[] = ["up", "down", "left", "right"];

  while (queue.length > 0) {
    const pos = queue.shift()!;
    const key = `${pos.x},${pos.y}`;
    if (visited.has(key) || obstacleSet.has(key)) continue;
    if (
      pos.x < 0 || pos.x >= BOARD_SIZE ||
      pos.y < 0 || pos.y >= BOARD_SIZE
    ) continue;
    visited.add(key);
    for (const dir of allDirs) queue.push(getNextHead(pos, dir));
  }

  return visited.size;
};

/**
 * NPC の次の移動方向を決定する（弱めAI）
 *
 * 弱さの要素:
 *  - 25%: 完全ランダムな安全方向（無駄な動き）
 *  - 15%: プレイヤーボディ回避チェックを無視（自滅リスク）
 *  - それ以外: 最近傍アイテム貪欲だがフラッドフィル閾値を低く設定
 */
export const getNPCNextDirection = (
  npcSnake: Position[],
  playerSnake: Position[],
  items: Position[],
  currentDir: Direction | null,
  _strength = 0.4, // 将来の難易度調整用
): Direction => {
  const head = npcSnake[0];
  const allDirs: Direction[] = ["up", "down", "left", "right"];

  // 15% の確率でプレイヤーボディ回避をサボる（プレイヤーに突っ込むことがある）
  const ignorePlayer = Math.random() < 0.15;

  const safeDirs = allDirs.filter((dir) => {
    if (currentDir && npcSnake.length >= 2 && isOppositeDirection(currentDir, dir)) return false;
    const next = getNextHead(head, dir);
    if (next.x < 0 || next.x >= BOARD_SIZE || next.y < 0 || next.y >= BOARD_SIZE) return false;
    if (containsPosition(npcSnake.slice(0, -1), next)) return false;
    if (!ignorePlayer && containsPosition(playerSnake.slice(0, -1), next)) return false;
    return true;
  });

  if (safeDirs.length === 0) {
    return currentDir ?? "right";
  }

  // 25%: 完全ランダム（アイテムを無視した無駄な動き）
  if (Math.random() < 0.25) {
    return safeDirs[Math.floor(Math.random() * safeDirs.length)];
  }

  if (items.length === 0) {
    return safeDirs.includes(currentDir as Direction)
      ? (currentDir as Direction)
      : safeDirs[0];
  }

  // 最近傍アイテムを探す（ただし稀に2番目に近いアイテムを狙う）
  const sorted = [...items].sort((a, b) => {
    const da = Math.abs(head.x - a.x) + Math.abs(head.y - a.y);
    const db = Math.abs(head.x - b.x) + Math.abs(head.y - b.y);
    return da - db;
  });
  // 20% の確率で2番目のアイテムを狙う（得点へのこだわりを弱める）
  const targetIdx = Math.random() < 0.2 && sorted.length > 1 ? 1 : 0;
  const targetItem = sorted[targetIdx];

  const obstacles = [
    ...npcSnake.slice(0, -1),
    ...playerSnake.slice(0, -1),
  ];

  const scored = safeDirs.map((dir) => {
    const next = getNextHead(head, dir);
    const dist = Math.abs(next.x - targetItem.x) + Math.abs(next.y - targetItem.y);
    const space = floodFill(next, obstacles);
    return { dir, dist, space };
  });

  // フラッドフィル閾値を低めに（追い詰められても強引に進む）
  const minSpace = Math.max(1, Math.floor(npcSnake.length * 0.4));

  scored.sort((a, b) => {
    const aOk = a.space >= minSpace;
    const bOk = b.space >= minSpace;
    if (aOk && !bOk) return -1;
    if (!aOk && bOk) return 1;
    if (a.dist !== b.dist) return a.dist - b.dist;
    return b.space - a.space;
  });

  return scored[0].dir;
};
