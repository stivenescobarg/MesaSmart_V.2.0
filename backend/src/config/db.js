const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB conectado");
  } catch (error) {
    console.error("⚠ MongoDB no disponible:", error.message);
    // No hacemos process.exit(1) para que el servidor siga corriendo
  }
};

module.exports = connectDB;