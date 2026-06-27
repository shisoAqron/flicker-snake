import { useCallback, useEffect, useRef, useState } from "react";
import type { Direction, GameState } from "../types";
import {
  ITEM_SPAWN_INTERVAL_MS,
  MAX_ITEMS,
  getMoveInterval,
  generateInitialItems,
  getNextHead,
  getNPCNextDirection,
  getRandomEmptyPosition,
  initialNPCSnake,
  initialSnake,
  isOppositeDirection,
  isSelfCollision,
} from "../utils/game";
import { containsPosition, isOutOfBounds } from "../utils/position";

const createInitialState = (): GameState => {
  const snake = [...initialSnake];
  const npcSnake = [...initialNPCSnake];
  return {
    snake,
    direction: null,
    nextDirection: null,
    npcSnake,
    npcDirection: null,
    items: generateInitialItems([...snake, ...npcSnake]),
    score: 0,
    npcScore: 0,
    status: "ready",
  };
};

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

        // ===== プレイヤー移動 =====
        const currentDir = prev.nextDirection ?? prev.direction;
        const head = prev.snake[0];
        const nextHead = getNextHead(head, currentDir);

        // 壁衝突
        if (isOutOfBounds(nextHead)) {
          return { ...prev, status: "gameOver", direction: currentDir };
        }

        // プレイヤーが NPC ボディに衝突
        if (containsPosition(prev.npcSnake.slice(0, -1), nextHead)) {
          return { ...prev, status: "gameOver", direction: currentDir };
        }

        // プレイヤーが NPC 頭に衝突
        if (prev.npcSnake.length > 0 && prev.npcSnake[0].x === nextHead.x && prev.npcSnake[0].y === nextHead.y) {
          return { ...prev, status: "gameOver", direction: currentDir };
        }

        const playerAteItem = containsPosition(prev.items, nextHead);

        // 自己衝突
        if (isSelfCollision(nextHead, prev.snake, playerAteItem)) {
          return { ...prev, status: "gameOver", direction: currentDir };
        }

        const newPlayerSnake = playerAteItem
          ? [nextHead, ...prev.snake]
          : [nextHead, ...prev.snake.slice(0, -1)];

        let newItems = playerAteItem
          ? prev.items.filter((item) => !(item.x === nextHead.x && item.y === nextHead.y))
          : prev.items;

        const newScore = playerAteItem ? prev.score + 1 : prev.score;

        // ===== NPC 移動 =====
        const npcDir = getNPCNextDirection(
          prev.npcSnake,
          newPlayerSnake,
          newItems,
          prev.npcDirection,
        );
        const npcNextHead = getNextHead(prev.npcSnake[0], npcDir);

        let newNpcSnake = prev.npcSnake;
        let newNpcDirection: typeof prev.npcDirection = npcDir;
        let newNpcScore = prev.npcScore;

        const npcHitWall = isOutOfBounds(npcNextHead);
        const npcHitSelf = isSelfCollision(npcNextHead, prev.npcSnake, false);
        const npcHitPlayer = containsPosition(newPlayerSnake.slice(0, -1), npcNextHead);

        if (npcHitWall || npcHitSelf || npcHitPlayer) {
          // NPC が死亡 → ランダム位置に長さ1でリスポーン
          const respawn = getRandomEmptyPosition(
            [...newPlayerSnake, ...prev.npcSnake],
            newItems,
          );
          newNpcSnake = respawn ? [respawn] : [prev.npcSnake[0]];
          newNpcDirection = null;
        } else {
          const npcAteItem = containsPosition(newItems, npcNextHead);
          newNpcSnake = npcAteItem
            ? [npcNextHead, ...prev.npcSnake]
            : [npcNextHead, ...prev.npcSnake.slice(0, -1)];
          if (npcAteItem) {
            newItems = newItems.filter(
              (item) => !(item.x === npcNextHead.x && item.y === npcNextHead.y),
            );
            newNpcScore = prev.npcScore + 1;
          }
        }

        return {
          ...prev,
          snake: newPlayerSnake,
          direction: currentDir,
          nextDirection: currentDir,
          npcSnake: newNpcSnake,
          npcDirection: newNpcDirection,
          items: newItems,
          score: newScore,
          npcScore: newNpcScore,
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
