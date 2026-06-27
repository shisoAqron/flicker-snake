import { useRef } from "react";
import type { Direction } from "../types";
import { detectSwipeDirection } from "../utils/game";

type UseSwipeOptions = {
  onSwipe: (direction: Direction) => void;
};

export const useSwipe = ({ onSwipe }: UseSwipeOptions) => {
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);

  const handlePointerDown = (event: React.PointerEvent) => {
    pointerStartRef.current = {
      x: event.clientX,
      y: event.clientY,
    };
  };

  const handlePointerUp = (event: React.PointerEvent) => {
    if (!pointerStartRef.current) return;

    const start = pointerStartRef.current;
    const end = { x: event.clientX, y: event.clientY };
    const direction = detectSwipeDirection(start, end);

    if (direction) {
      onSwipe(direction);
    }

    pointerStartRef.current = null;
  };

  return { handlePointerDown, handlePointerUp };
};
