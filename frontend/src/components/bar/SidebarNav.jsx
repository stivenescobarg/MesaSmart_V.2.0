// src/components/bar/SidebarNav.jsx

const SidebarNav = ({ vistaPedidos, vistaInventario, vistaHistorial, onNavChange, vistaActual }) => {
  const items = [
    { id: "pedidos", icono: "📋", etiqueta: "Pedidos", action: vistaPedidos },
    { id: "inventario", icono: "📦", etiqueta: "Inventario", action: vistaInventario },
    { id: "historial", icono: "📜", etiqueta: "Historial", action: vistaHistorial },
  ];

  return (
    <nav className="bd-sidebar-nav">
      {items.map((item) => (
        <button
          key={item.id}
          className={`bd-nav-item ${vistaActual === item.id ? "activo" : ""}`}
          onClick={() => {
            onNavChange(item.id);
            item.action?.();
          }}
          title={item.etiqueta}
        >
          <span className="bd-nav-icon">{item.icono}</span>
          <span>{item.etiqueta}</span>
        </button>
      ))}
    </nav>
  );
};

export default SidebarNav;