import { useNavigate } from "react-router-dom";

const HomePage = () => {
  const navigate = useNavigate();

  return (
    <div className="home-page">
      <h1 className="home-title">🐍 Flicker Snake</h1>
      <p className="home-subtitle">フリックでヘビを操ろう</p>
      <button
        className="start-button"
        onClick={() => navigate("/game")}
      >
        START
      </button>
    </div>
  );
};

export default HomePage;
