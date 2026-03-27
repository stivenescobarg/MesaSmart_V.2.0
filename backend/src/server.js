require("dotenv").config();

const app = require("./app"); // ✅ correcto porque están en la misma carpeta

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("🚀 Servidor corriendo en puerto", PORT);
});