import type { Direction, Position } from "../types";
import { BOARD_SIZE, positionEquals } from "./position";

export const MOVE_INTERVAL_MS = 150;
export const ITEM_SPAWN_INTERVAL_MS = 2000;
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
