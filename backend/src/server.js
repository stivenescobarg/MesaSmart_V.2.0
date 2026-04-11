// backend/src/server.js
require("dotenv").config();
const { connectDB } = require("./config/db");
const app = require("./app");

connectDB().then(() => {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () =>
    console.log(`🚀 Servidor MesaSmart corriendo en http://localhost:${PORT}`)
  );
});