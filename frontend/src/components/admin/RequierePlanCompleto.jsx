// frontend/src/components/admin/RequierePlanCompleto.jsx
// Pantalla que se muestra en vez del contenido de una sección cuando el
// backend responde 403 con codigo "PLAN_INSUFICIENTE". Reemplaza el error
// genérico ("No se pudieron cargar los datos") por un mensaje claro de
// upsell, consistente en las 3 secciones que lo necesitan.

const RequierePlanCompleto = ({ nombreSeccion = "Esta función" }) => (
  <div className="estado-vacio" style={{ textAlign: "center", padding: "2.5rem 1.5rem" }}>
    <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🔒</div>
    <h3 style={{ margin: "0 0 0.4rem", color: "var(--text-1)" }}>
      {nombreSeccion} está disponible en el Plan Completo
    </h3>
    <p className="texto-secundario" style={{ maxWidth: "420px", margin: "0 auto" }}>
      Tu restaurante tiene el Plan Básico. Actualiza a Completo para desbloquear
      esta sección y el resto de funciones financieras avanzadas.
    </p>
  </div>
);

export default RequierePlanCompleto;