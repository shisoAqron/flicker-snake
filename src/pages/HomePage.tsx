import { useNavigate } from "react-router-dom";

const HomePage = () => {
  const navigate = useNavigate();

  return (
    <div className="home-page">
      <h1 className="home-title">🐍 Flicker Snake</h1>
      <p className="home-subtitle">フリックでヘビを操ろう</p>
      <div className="home-buttons">
        <button
          className="start-button"
          onClick={() => navigate("/game")}
        >
          START
        </button>
        <button
          className="vs-button"
          onClick={() => navigate("/game?mode=vs")}
        >
          VS MODE
        </button>
      </div>
    </div>
  );
};

export default HomePage;
