import type { Direction, Position } from "../types";
import { BOARD_SIZE, containsPosition, positionEquals } from "./position";

export const MOVE_INTERVAL_MS = 150;
export const MOVE_INTERVAL_MIN_MS = 10;
export const ITEM_SPAWN_INTERVAL_MS = 2000;

/**
 * スネークの長さに応じた移動間隔(ms)を返す
 * 長さ 1-9: 150ms, 10-19: 130ms, 20-29: 110ms ... 70+: 10ms(下限)
 */
export const getMoveInterval = (snakeLength: number): number =>
  Math.max(MOVE_INTERVAL_MIN_MS, MOVE_INTERVAL_MS - Math.floor(snakeLength / 10) * 20);
export const MAX_ITEMS = 3;
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
 * NPC の次の移動方向を決定する
 *
 * 戦略（強さ調整用に _strength パラメータを用意、現状は固定）:
 *  1. 安全な方向を列挙（壁・自身・プレイヤーとの衝突を回避）
 *  2. 各方向についてフラッドフィルで到達可能空間を計算
 *  3. 空間が十分ある方向の中で最も近いアイテムへ向かう方向を選ぶ
 *  4. すべて空間不足なら最も広い方向を選ぶ（生存優先）
 */
export const getNPCNextDirection = (
  npcSnake: Position[],
  playerSnake: Position[],
  items: Position[],
  currentDir: Direction | null,
  _strength = 0.7, // 0.0=random〜1.0=optimal（将来の難易度調整用）
): Direction => {
  const head = npcSnake[0];
  const allDirs: Direction[] = ["up", "down", "left", "right"];

  // 安全な方向を列挙（逆方向・壁・ボディとの衝突を除外）
  const safeDirs = allDirs.filter((dir) => {
    if (currentDir && npcSnake.length >= 2 && isOppositeDirection(currentDir, dir)) return false;
    const next = getNextHead(head, dir);
    if (next.x < 0 || next.x >= BOARD_SIZE || next.y < 0 || next.y >= BOARD_SIZE) return false;
    if (containsPosition(npcSnake.slice(0, -1), next)) return false;
    if (containsPosition(playerSnake.slice(0, -1), next)) return false;
    return true;
  });

  // 安全な方向がなければ直進継続（死を受け入れる）
  if (safeDirs.length === 0) {
    return currentDir ?? "right";
  }

  // アイテムがなければ直進 or 安全な方向を維持
  if (items.length === 0) {
    return safeDirs.includes(currentDir as Direction)
      ? (currentDir as Direction)
      : safeDirs[0];
  }

  // 最も近いアイテムを探す
  const nearestItem = items.reduce((best, item) => {
    const d = Math.abs(head.x - item.x) + Math.abs(head.y - item.y);
    const bd = Math.abs(head.x - best.x) + Math.abs(head.y - best.y);
    return d < bd ? item : best;
  });

  // 障害物セット（NPC自身 + プレイヤー、末尾は移動後に消えるので除外）
  const obstacles = [
    ...npcSnake.slice(0, -1),
    ...playerSnake.slice(0, -1),
  ];

  // 各方向をスコアリング
  const scored = safeDirs.map((dir) => {
    const next = getNextHead(head, dir);
    const dist = Math.abs(next.x - nearestItem.x) + Math.abs(next.y - nearestItem.y);
    const space = floodFill(next, obstacles);
    return { dir, dist, space };
  });

  const minSpace = npcSnake.length;

  // 空間が十分ある方向 → アイテムへの距離で選ぶ
  // 空間が不十分な方向のみ → 最も広い方向を選ぶ（生存優先）
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
