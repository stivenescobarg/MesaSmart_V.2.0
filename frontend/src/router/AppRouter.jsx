import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "../pages/Login";
import Admin from "../pages/AdminDashboard";
import KitchenDashboard from "../pages/KitchenDashboard";
import BartenderDashboard from "../pages/BartenderDashboard";
import DetalleProducto from "../pages/DetalleProducto";
import Menu from "../pages/Menu";

const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"        element={<Login />} />
        <Route path="/login"   element={<Login />} />  {/* ← AGREGA ESTA */}
        <Route path="/admin"   element={<Admin />} />
        <Route path="/kitchen/:id"   element={<KitchenDashboard />} />
        <Route path="/bartender/:id" element={<BartenderDashboard />} />
        <Route path="/producto" element={<DetalleProducto />} />
        <Route path="/menu"    element={<Menu />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;