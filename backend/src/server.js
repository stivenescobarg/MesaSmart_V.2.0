// backend/src/server.js
require("dotenv").config();
const app             = require("./app");
const { connectDB }   = require("./config/db");

connectDB().then(() => {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () =>
    console.log(`🚀 Servidor MesaSmart corriendo en http://localhost:${PORT}`)
  );
});