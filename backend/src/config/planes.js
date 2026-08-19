// backend/src/config/planes.js

// Features del plan básico. El plan completo las hereda + agrega las suyas.
const FEATURES_BASICO = [
  "pedidos",
  "mesas",
  "productos",
  "caja",
  "ventas_por_pago",
  "dashboard_basico",
  "usuarios_ilimitados",
];

const FEATURES_COMPLETO = [
  ...FEATURES_BASICO,
  "gastos",
  "cuentas_por_pagar",
  "dashboard_financiero",
  "reporte_pdf_diario",
  "exportacion_excel",
];

const PLANES = {
  basico:   { label: "Básico",   features: new Set(FEATURES_BASICO) },
  completo: { label: "Completo", features: new Set(FEATURES_COMPLETO) },
};

module.exports = { PLANES };