const Ingrediente = require("../models/Ingrediente");

const obtenerIngredientes = async (req, res) => {
    try {
        const ingredientes = await Ingrediente.obtenerTodos();

        res.json({
            ok: true,
            ingredientes
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            ok: false,
            msg: "Error al obtener ingredientes"
        });
    }
};

module.exports = {
    obtenerIngredientes
};