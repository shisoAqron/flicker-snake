import { useCallback, useEffect, useRef, useState } from "react";
import type { Direction, GameState } from "../types";
import {
  ITEM_SPAWN_INTERVAL_MS,
  MAX_ITEMS,
  getMoveInterval,
  generateInitialItems,
  getNextHead,
  getRandomEmptyPosition,
  initialSnake,
  isOppositeDirection,
  isSelfCollision,
} from "../utils/game";
import { containsPosition, isOutOfBounds } from "../utils/position";

const createInitialState = (): GameState => ({
  snake: [...initialSnake],
  direction: null,
  nextDirection: null,
  items: generateInitialItems([...initialSnake]),
  score: 0,
  status: "ready",
});

export const useSnakeGame = () => {
  const [state, setState] = useState<GameState>(createInitialState);

  const stateRef = useRef<GameState>(state);
  stateRef.current = state;

  const setDirection = useCallback((dir: Direction) => {
    setState((prev) => {
      if (prev.status === "gameOver") return prev;

      // ready → playing に移行
      if (prev.status === "ready") {
        return {
          ...prev,
          status: "playing",
          direction: dir,
          nextDirection: dir,
        };
      }

      // 逆方向は無視（長さ2以上のとき）
      if (
        prev.direction &&
        prev.snake.length >= 2 &&
        isOppositeDirection(prev.direction, dir)
      ) {
        return prev;
      }

      return { ...prev, nextDirection: dir };
    });
  }, []);

  const retry = useCallback(() => {
    setState(createInitialState());
  }, []);

  // 移動タイマー（スネーク長に応じて速度変化）
  const snakeLength = state.snake.length;
  useEffect(() => {
    const interval = setInterval(() => {
      setState((prev) => {
        if (prev.status !== "playing" || prev.direction === null) return prev;

        const currentDir = prev.nextDirection ?? prev.direction;
        const head = prev.snake[0];
        const nextHead = getNextHead(head, currentDir);

        // 壁衝突
        if (isOutOfBounds(nextHead)) {
          return { ...prev, status: "gameOver", direction: currentDir };
        }

        const ateItem = containsPosition(prev.items, nextHead);

        // 自己衝突
        if (isSelfCollision(nextHead, prev.snake, ateItem)) {
          return { ...prev, status: "gameOver", direction: currentDir };
        }

        const newSnake = ateItem
          ? [nextHead, ...prev.snake]
          : [nextHead, ...prev.snake.slice(0, -1)];

        const newItems = ateItem
          ? prev.items.filter(
              (item) => !(item.x === nextHead.x && item.y === nextHead.y)
            )
          : prev.items;

        return {
          ...prev,
          snake: newSnake,
          direction: currentDir,
          nextDirection: currentDir,
          items: newItems,
          score: ateItem ? prev.score + 1 : prev.score,
        };
      });
    }, getMoveInterval(snakeLength));

    return () => clearInterval(interval);
  }, [snakeLength]);

  // アイテム追加タイマー
  useEffect(() => {
    const interval = setInterval(() => {
      setState((prev) => {
        if (prev.status !== "playing") return prev;
        if (prev.items.length >= MAX_ITEMS) return prev;

        const newPos = getRandomEmptyPosition(prev.snake, prev.items);
        if (!newPos) return prev;

        return { ...prev, items: [...prev.items, newPos] };
      });
    }, ITEM_SPAWN_INTERVAL_MS);

    return () => clearInterval(interval);
  }, []);

  return { state, setDirection, retry };
};
