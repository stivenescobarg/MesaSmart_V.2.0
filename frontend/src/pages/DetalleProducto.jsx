import { useLocation, useNavigate } from "react-router-dom";
import "./DetalleProducto.css";

const DetalleProducto = () => {
  const navigate = useNavigate();
  const { state } = useLocation();

  if (!state) return <h2>Error</h2>;

  const { producto } = state;

  return (
    <div className="detalle-container">

      <button onClick={() => navigate(-1)}>⬅ Volver</button>

      <img src={producto.img} />

      <h2>{producto.nombre}</h2>

      <p>{producto.descripcion}</p>

      {/* OPCIONES */}
      {producto.opciones && (
        <>
          <h3>Elige:</h3>
          {producto.opciones.map((op, i) => (
            <label key={i}>
              <input type="radio" name="opcion" /> {op}
            </label>
          ))}
        </>
      )}

      {/* EXTRAS */}
      {producto.extras && (
        <>
          <h3>Extras:</h3>
          {producto.extras.map((ex, i) => (
            <label key={i}>
              <input type="checkbox" /> {ex}
            </label>
          ))}
        </>
      )}

      <button className="btn">Agregar</button>

    </div>
  );
};

export default DetalleProducto;