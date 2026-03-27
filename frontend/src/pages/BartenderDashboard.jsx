import { useParams, useNavigate } from "react-router-dom";

const BartenderDashboard = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <div style={{ background: "#fff", minHeight: "100vh", padding: "20px" }}>
      <button onClick={() => navigate("/")}>Salir</button>
      <h1>Panel de Bartender {id}</h1>
    </div>
  );
};

export default BartenderDashboard;