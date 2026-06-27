import { useEffect, useRef } from "react";
import type { Direction } from "../types";
import { detectSwipeDirection } from "../utils/game";

type UseSwipeOptions = {
  onSwipe: (direction: Direction) => void;
};

export const useSwipe = ({ onSwipe }: UseSwipeOptions) => {
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      pointerStartRef.current = { x: event.clientX, y: event.clientY };
    };

    const handlePointerUp = (event: PointerEvent) => {
      if (!pointerStartRef.current) return;

      const direction = detectSwipeDirection(pointerStartRef.current, {
        x: event.clientX,
        y: event.clientY,
      });

      if (direction) onSwipe(direction);

      pointerStartRef.current = null;
    };

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [onSwipe]);
};
