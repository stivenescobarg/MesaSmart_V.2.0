import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const KitchenDashboard = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleSalir = async () => {
    console.log('Token antes:', localStorage.getItem('ms_token'));
    await logout();
    console.log('Token después:', localStorage.getItem('ms_token'));

    navigate("/login");
  };

  return (
    <div style={{ background: "#fff", minHeight: "100vh", padding: "20px" }}>
      <button onClick={handleSalir}>Salir</button>
      <h1>Panel de Cocina {id}</h1>
    </div>
  );
};

export default KitchenDashboard;