const express = require("express");
const cors = require("cors");
const db = require("./config/db");

// rutas que ya tenías
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");

const app = express();

app.use(cors());
app.use(express.json());

// 🔹 rutas existentes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);

// 🔥 NUEVA RUTA: productos (menú)
app.get("/api/productos", (req, res) => {
  db.query("SELECT * FROM productos", (err, result) => {
    if (err) {
      console.error(err);
      res.status(500).send("Error en la consulta");
    } else {
      res.json(result);
    }
  });
});

// 🔥 NUEVA RUTA: crear producto
app.post("/api/productos", (req, res) => {
  const { nombre, precio } = req.body;

  db.query(
    "INSERT INTO productos (nombre, precio) VALUES (?, ?)",
    [nombre, precio],
    (err, result) => {
      if (err) {
        console.error(err);
        res.status(500).send("Error al insertar");
      } else {
        res.send("Producto agregado");
      }
    }
  );
});

module.exports = app;