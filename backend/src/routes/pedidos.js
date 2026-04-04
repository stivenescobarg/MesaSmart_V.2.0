const express = require('express');
const router  = express.Router();
const {
  getPedidos,
  createPedido,
  updateEstadoPedido,
  getEstados,
  getCategorias,
  getCocineroTurno,
} = require('../controllers/pedidosController');

// Pedidos
router.get   ('/',           getPedidos);
router.post  ('/',           createPedido);
router.patch ('/:id/estado', updateEstadoPedido);

// Catálogos
router.get('/estados',   getEstados);
router.get('/categorias', getCategorias);

// Turno (mock)
router.get('/cocinero', getCocineroTurno);

module.exports = router;
