const express = require("express");
const router = express.Router();

const {
    obtenerIngredientes
} = require("../controllers/ingredienteController");

router.get("/", obtenerIngredientes);

module.exports = router;