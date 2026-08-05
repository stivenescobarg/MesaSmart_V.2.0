const { pool } = require("../config/db");

const Ingrediente = {

    async obtenerTodos() {

        const [rows] = await pool.query(`
            SELECT *
            FROM ingredientes
            WHERE estado = 1
            ORDER BY nombre ASC
        `);

        return rows;
    }

};

module.exports = Ingrediente;