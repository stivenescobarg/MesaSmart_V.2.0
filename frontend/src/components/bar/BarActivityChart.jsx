// src/components/bar/BarActivityChart.jsx
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useEffect, useState, useCallback } from "react";
import { barService } from "../../services/barService";

const INTERVALO_ACTUALIZACION_MS = 60000; // refresca cada 60s

const BarActivityChart = () => {
  const [data, setData] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const cargar = useCallback(async () => {
    try {
      const respuesta = await barService.getActividad();
      setData(respuesta.actividad || []);
      setError("");
    } catch (err) {
      setError(err.message || "No fue posible cargar la actividad del bar.");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
    const intervalo = setInterval(cargar, INTERVALO_ACTUALIZACION_MS);
    return () => clearInterval(intervalo);
  }, [cargar]);

  if (cargando) {
    return <div className="bd-chart-container"><div className="bd-chart-wrapper bd-chart-empty">Cargando actividad...</div></div>;
  }

  if (error) {
    return <div className="bd-chart-container"><div className="bd-chart-wrapper bd-chart-empty">{error}</div></div>;
  }

  return (
    <div className="bd-chart-container">
      <div className="bd-chart-wrapper">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--bar-border)" vertical={false} />
            <XAxis
              dataKey="tiempo"
              tick={{ fontSize: 10, fill: "var(--bar-muted)" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis hide={true} allowDecimals={false} />
            <Tooltip
              contentStyle={{
                background: "var(--bar-card)",
                border: `1px solid var(--bar-border)`,
                borderRadius: "8px",
                color: "var(--bar-text)",
                fontSize: "11px",
              }}
              labelStyle={{ color: "var(--bar-text)" }}
              formatter={(value) => [value, "Órdenes"]}
            />
            <Line
              type="monotone"
              dataKey="ordenes"
              stroke="var(--bar-accent)"
              strokeWidth={2.5}
              dot={false}
              isAnimationActive={true}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default BarActivityChart;