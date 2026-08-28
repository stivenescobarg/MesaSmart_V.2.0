// backend/src/models/PagoSuscripcion.js
const { pool } = require("../config/db");

const PagoSuscripcion = {
  crear: async ({ restaurante_id, monto, periodo_desde, periodo_hasta, fecha_pago, metodo_pago, notas, registrado_por }) => {
    const [result] = await pool.execute(
      `INSERT INTO pagos_suscripcion
        (restaurante_id, monto, periodo_desde, periodo_hasta, fecha_pago, metodo_pago, notas, registrado_por)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [restaurante_id, monto, periodo_desde, periodo_hasta, fecha_pago, metodo_pago || "transferencia", notas || null, registrado_por || null]
    );
    return result.insertId;
  },

  getByRestaurante: async (restaurante_id) => {
    const [rows] = await pool.execute(
      `SELECT id, monto, periodo_desde, periodo_hasta, fecha_pago, metodo_pago, notas, creado_en
       FROM pagos_suscripcion
       WHERE restaurante_id = ?
       ORDER BY periodo_hasta DESC, id DESC`,
      [restaurante_id]
    );
    return rows;
  },

  // El pago "vigente" es el que tiene el periodo_hasta más lejano en el
  // futuro (o más reciente en el pasado si ninguno cubre hoy). Sirve para
  // calcular si el restaurante está al día sin traer todo el historial.
  getUltimo: async (restaurante_id) => {
    const [rows] = await pool.execute(
      `SELECT id, monto, periodo_desde, periodo_hasta, fecha_pago, metodo_pago
       FROM pagos_suscripcion
       WHERE restaurante_id = ?
       ORDER BY periodo_hasta DESC, id DESC
       LIMIT 1`,
      [restaurante_id]
    );
    return rows[0] || null;
  },
};

module.exports = PagoSuscripcion;