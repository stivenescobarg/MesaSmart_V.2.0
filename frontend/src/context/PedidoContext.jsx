import { createContext, useState } from "react";

export const PedidoContext = createContext();

export const PedidoProvider = ({ children }) => {
  const [pedidosCocina, setPedidosCocina] = useState([]);
  const [pedidosBar, setPedidosBar] = useState([]);

  const agregarPedido = (producto) => {
    const pedido = {
      nombre: producto.nombre,
      hora: new Date().toLocaleTimeString()
    };

    if (producto.destino === "cocina") {
      setPedidosCocina(prev => [...prev, pedido]);
    } else {
      setPedidosBar(prev => [...prev, pedido]);
    }
  };

  return (
    <PedidoContext.Provider value={{
      pedidosCocina,
      pedidosBar,
      agregarPedido
    }}>
      {children}
    </PedidoContext.Provider>
  );
};