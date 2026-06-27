import type { Position } from "../types";

export const BOARD_SIZE = 20;

export const positionEquals = (a: Position, b: Position): boolean =>
  a.x === b.x && a.y === b.y;

export const isOutOfBounds = (position: Position): boolean =>
  position.x < 0 ||
  position.x >= BOARD_SIZE ||
  position.y < 0 ||
  position.y >= BOARD_SIZE;

export const containsPosition = (
  positions: Position[],
  target: Position
): boolean => positions.some((p) => positionEquals(p, target));
