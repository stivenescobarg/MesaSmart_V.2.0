const express = require("express");
const cors = require("cors");

// AGREGA ESTA LÍNEA:
require("./config/mysqlDb");

const authRoutes    = require("./routes/authRoutes");
const userRoutes    = require("./routes/userRoutes");
const pedidosRouter = require("./routes/pedidos");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth",  authRoutes);
app.use("/api/users", userRoutes);

app.use("/api/pedidos",    pedidosRouter);
app.use("/api/estados",    pedidosRouter);
app.use("/api/categorias", pedidosRouter);
app.use("/api/turno",      pedidosRouter);

module.exports = app;