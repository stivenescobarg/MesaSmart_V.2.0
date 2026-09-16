import { useState, useEffect } from "react";
import "./OrderCard.css";

// ... el resto del código igual hasta la función ItemRow

function ItemRow({ item }) {
  const img = item.imagen || null;
  return (
    <div className="oc-item">
      <div className="oc-item-img">
        {img ? <img src={img} alt={item.nombre} /> : <span>🍽️</span>}
      </div>
      <span className="oc-item-qty">{item.cantidad}</span>
      <div className="oc-item-info">
        <p className="oc-item-nombre">{item.nombre}</p>
        {item.notas && (
          <p className="oc-item-notas">⚠ {item.notas}</p>
        )}
      </div>
    </div>
  );
}