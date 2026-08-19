// frontend/src/components/common/Paginador.jsx
const Paginador = ({ pagina, totalPaginas, onAnterior, onSiguiente, onIrA }) => {
  if (totalPaginas <= 1) return null;

  // Muestra máximo 5 números de página, centrados en la actual
  const paginas = [];
  const inicio = Math.max(1, pagina - 2);
  const fin = Math.min(totalPaginas, inicio + 4);
  for (let i = inicio; i <= fin; i++) paginas.push(i);

  return (
    <div className="paginador">
      <button
        className="paginador-btn"
        onClick={onAnterior}
        disabled={pagina === 1}
      >
        ‹ Anterior
      </button>

      <div className="paginador-numeros">
        {inicio > 1 && (
          <>
            <button className="paginador-num" onClick={() => onIrA(1)}>1</button>
            {inicio > 2 && <span className="paginador-dots">…</span>}
          </>
        )}

        {paginas.map((n) => (
          <button
            key={n}
            className={`paginador-num ${n === pagina ? "activo" : ""}`}
            onClick={() => onIrA(n)}
          >
            {n}
          </button>
        ))}

        {fin < totalPaginas && (
          <>
            {fin < totalPaginas - 1 && <span className="paginador-dots">…</span>}
            <button className="paginador-num" onClick={() => onIrA(totalPaginas)}>
              {totalPaginas}
            </button>
          </>
        )}
      </div>

      <button
        className="paginador-btn"
        onClick={onSiguiente}
        disabled={pagina === totalPaginas}
      >
        Siguiente ›
      </button>
    </div>
  );
};

export default Paginador;