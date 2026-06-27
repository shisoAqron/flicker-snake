import { useCallback, useEffect, useRef, useState } from "react";
import type { Direction, GameState } from "../types";
import {
  ITEM_SPAWN_INTERVAL_MS,
  ITEM_SPAWN_INTERVAL_VS_MS,
  MAX_ITEMS,
  MAX_ITEMS_VS,
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

const createInitialState = (mode: "solo" | "vs"): GameState => {
  const snake = [...initialSnake];
  const npcSnake = mode === "vs" ? [...initialNPCSnake] : [];
  return {
    snake,
    direction: null,
    nextDirection: null,
    npcSnake,
    npcDirection: null,
    items: generateInitialItems([...snake, ...npcSnake]),
    score: 0,
    npcScore: 0,
    timeLeft: mode === "vs" ? 60 : 0,
    result: null,
    status: "ready",
  };
};

export const useSnakeGame = (mode: "solo" | "vs" = "solo") => {
  const [state, setState] = useState<GameState>(() => createInitialState(mode));

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
    setState(createInitialState(mode));
  }, [mode]);

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
          return { ...prev, status: "gameOver", direction: currentDir, result: mode === "vs" ? "npc" : null };
        }

        // プレイヤーが NPC ボディに衝突（VS モードのみ）
        if (mode === "vs" && containsPosition(prev.npcSnake.slice(0, -1), nextHead)) {
          return { ...prev, status: "gameOver", direction: currentDir, result: "npc" };
        }

        // プレイヤーが NPC 頭に衝突（VS モードのみ）
        if (mode === "vs" && prev.npcSnake.length > 0 && prev.npcSnake[0].x === nextHead.x && prev.npcSnake[0].y === nextHead.y) {
          return { ...prev, status: "gameOver", direction: currentDir, result: "npc" };
        }

        const playerAteItem = containsPosition(prev.items, nextHead);

        // 自己衝突
        if (isSelfCollision(nextHead, prev.snake, playerAteItem)) {
          return { ...prev, status: "gameOver", direction: currentDir, result: mode === "vs" ? "npc" : null };
        }

        const newPlayerSnake = playerAteItem
          ? [nextHead, ...prev.snake]
          : [nextHead, ...prev.snake.slice(0, -1)];

        let newItems = playerAteItem
          ? prev.items.filter((item) => !(item.x === nextHead.x && item.y === nextHead.y))
          : prev.items;

        const newScore = playerAteItem ? prev.score + 1 : prev.score;

        // ===== NPC 移動（VS モードのみ）=====
        if (mode !== "vs") {
          return {
            ...prev,
            snake: newPlayerSnake,
            direction: currentDir,
            nextDirection: currentDir,
            items: newItems,
            score: newScore,
          };
        }

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
  }, [snakeLength, mode]);

  // アイテム追加タイマー（VS モードは上限5・800ms間隔、solo は上限3・2000ms間隔）
  const maxItems = mode === "vs" ? MAX_ITEMS_VS : MAX_ITEMS;
  const spawnInterval = mode === "vs" ? ITEM_SPAWN_INTERVAL_VS_MS : ITEM_SPAWN_INTERVAL_MS;
  useEffect(() => {
    const interval = setInterval(() => {
      setState((prev) => {
        if (prev.status !== "playing") return prev;
        if (prev.items.length >= maxItems) return prev;

        const newPos = getRandomEmptyPosition(prev.snake, prev.items);
        if (!newPos) return prev;

        return { ...prev, items: [...prev.items, newPos] };
      });
    }, spawnInterval);

    return () => clearInterval(interval);
  }, [maxItems, spawnInterval]);

  // VS モード: 60 秒カウントダウン → 時間切れで長さ比較
  useEffect(() => {
    if (mode !== "vs") return;

    const interval = setInterval(() => {
      setState((prev) => {
        if (prev.status !== "playing") return prev;

        const next = prev.timeLeft - 1;

        if (next <= 0) {
          const pLen = prev.snake.length;
          const nLen = prev.npcSnake.length;
          const result = pLen > nLen ? "player" : pLen < nLen ? "npc" : "draw";
          return { ...prev, status: "gameOver", timeLeft: 0, result };
        }

        return { ...prev, timeLeft: next };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [mode]);

  return { state, setDirection, retry };
};
