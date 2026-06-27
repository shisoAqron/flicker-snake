import type { Direction, GameState } from "../types";
import { BOARD_SIZE } from "../utils/position";
import { useSwipe } from "../hooks/useSwipe";
import SnakeSegment from "./SnakeSegment";
import NPCSegment from "./NPCSegment";
import GrowthItem from "./GrowthItem";

type Props = {
  state: GameState;
  onSwipe: (direction: Direction) => void;
};

const GameBoard = ({ state, onSwipe }: Props) => {
  useSwipe({ onSwipe });

  const snakeMap = new Map<string, number>();
  state.snake.forEach((seg, i) => snakeMap.set(`${seg.x},${seg.y}`, i));

  const npcMap = new Map<string, number>();
  state.npcSnake.forEach((seg, i) => npcMap.set(`${seg.x},${seg.y}`, i));

  const itemSet = new Set<string>(
    state.items.map((item) => `${item.x},${item.y}`)
  );

  const cells = [];
  for (let y = 0; y < BOARD_SIZE; y++) {
    for (let x = 0; x < BOARD_SIZE; x++) {
      const key = `${x},${y}`;
      const snakeIndex = snakeMap.get(key);
      const npcIndex = npcMap.get(key);
      const isItem = itemSet.has(key);

      cells.push(
        <div key={key} className="cell">
          {snakeIndex !== undefined && (
            <SnakeSegment index={snakeIndex} isHead={snakeIndex === 0} />
          )}
          {npcIndex !== undefined && (
            <NPCSegment index={npcIndex} isHead={npcIndex === 0} />
          )}
          {isItem && <GrowthItem />}
        </div>
      );
    }
  }

  return (
    <div className="game-board">
      {cells}
    </div>
  );
};

export default GameBoard;
