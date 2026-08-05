// frontend/src/components/kitchen/KitchenSidebar.jsx
// Sidebar izquierdo compartido entre las vistas de Pedidos y Stock.
// Recibe la lista de items a mostrar (cambia según la vista activa)
// y no contiene lógica propia: solo navegación visual.
// Al final se muestra el estado de la cocina (activa/inactiva) y el turno.

const KitchenSidebar = ({ items, activo, onSelect }) => {
  return (
    <aside className="kc-sidebar">
      <nav className="kc-sidebar-nav">
        {items.map(item => (
          <button
            key={item.key}
            className={`kc-sidebar-item ${activo === item.key ? "activo" : ""}`}
            onClick={() => onSelect(item.key)}
          >
            <span className="kc-sidebar-icon">{item.icon}</span>
            <span className="kc-sidebar-label">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="kc-sidebar-footer">
        <p className="kc-sidebar-status">
          <span className="kc-sidebar-status-dot" />
          Cocina activa
        </p>
        <p className="kc-sidebar-turno-label">Turno noche</p>
        <p className="kc-sidebar-turno-horas">07:00 p. m. - 03:00 a. m.</p>
      </div>
    </aside>
  );
};

export default KitchenSidebar;