import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import GameBoard from "../components/GameBoard";
import { useSnakeGame } from "../hooks/useSnakeGame";

const GamePage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get("mode") === "vs" ? "vs" : "solo";
  const { state, setDirection, retry } = useSnakeGame(mode);

  // PCキーボード操作
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowUp":
          e.preventDefault();
          setDirection("up");
          break;
        case "ArrowDown":
          e.preventDefault();
          setDirection("down");
          break;
        case "ArrowLeft":
          e.preventDefault();
          setDirection("left");
          break;
        case "ArrowRight":
          e.preventDefault();
          setDirection("right");
          break;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setDirection]);

  return (
    <div className="game-page">
      <div className="game-header">
        {mode === "vs" ? (
          <>
            <div className="score-block">
              <span className="score-label">YOU</span>
              <span className="score-value">{state.score}</span>
            </div>
            <div className="score-block score-block--npc">
              <span className="score-label">NPC</span>
              <span className="score-value score-value--npc">{state.npcScore}</span>
            </div>
          </>
        ) : (
          <div className="score-block">
            <span className="score-label">SCORE</span>
            <span className="score-value">{state.score}</span>
          </div>
        )}
      </div>

      {state.status === "ready" && (
        <p className="game-hint">フリックしてスタート</p>
      )}

      <div className="game-board-wrapper">
        <GameBoard state={state} onSwipe={setDirection} />

        {state.status === "gameOver" && (
          <div className="game-over-overlay">
            <h2 className="game-over-title">GAME OVER</h2>
            <p className="game-over-score">Score: {state.score}</p>
            <button className="retry-button" onClick={retry}>
              RETRY
            </button>
            <button className="home-button" onClick={() => navigate("/")}>
              TOP へ戻る
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default GamePage;
