// backend/src/services/barSecurityService.js
const crypto = require("crypto");
const { pool } = require("../config/db");
const BarPinAttempt = require("../models/BarPinAttempt");

const barSecurityService = {
  hashearPin(pin) {
    return crypto.createHash("sha256").update(pin).digest("hex");
  },

  async obtenerPinHash(restaurante_id) {
    const [[restaurante]] = await pool.query(
      `SELECT pin_seguridad FROM restaurantes WHERE id = ?`,
      [restaurante_id]
    );

    if (restaurante?.pin_seguridad) {
      return restaurante.pin_seguridad;
    }

    // Fallback temporal: PIN por defecto del .env mientras el restaurante no configure el suyo
    return this.hashearPin(process.env.STOCK_PIN || "1234");
  },

  async validarPin(pin_ingresado, restaurante_id, usuario_id, ip_address, tipo_accion) {
    try {
      if (!restaurante_id) {
        return {
          valido: false,
          mensaje: "No se pudo determinar el restaurante.",
          codigo: "RESTAURANTE_REQUERIDO",
        };
      }

      if (!pin_ingresado || typeof pin_ingresado !== "string") {
        return {
          valido: false,
          mensaje: "PIN requerido",
          codigo: "PIN_REQUERIDO",
        };
      }

      if (!/^\d{4,8}$/.test(pin_ingresado)) {
        return {
          valido: false,
          mensaje: "PIN debe contener 4-8 dígitos",
          codigo: "PIN_FORMATO_INVALIDO",
        };
      }

      // Verificar intentos fallidos previos (rate limiting) - por restaurante
      const intentosFallidos = await BarPinAttempt.obtenerIntentosFailidos(
        restaurante_id,
        usuario_id,
        ip_address,
        15
      );

      if (intentosFallidos >= 3) {
        await BarPinAttempt.registrar({
          restaurante_id,
          usuario_id,
          tipo_accion,
          exito: false,
          ip_address,
        });

        return {
          valido: false,
          mensaje: "Demasiados intentos fallidos. Intenta de nuevo en 15 minutos.",
          codigo: "PIN_BLOQUEADO",
        };
      }

      // Verificar PIN (hash específico del restaurante)
      const pinHashCorrecto = await this.obtenerPinHash(restaurante_id);
      const hashIngresado = this.hashearPin(pin_ingresado);

      if (hashIngresado !== pinHashCorrecto) {
        await BarPinAttempt.registrar({
          restaurante_id,
          usuario_id,
          tipo_accion,
          exito: false,
          ip_address,
        });

        const intentosRestantes = 3 - intentosFallidos - 1;
        return {
          valido: false,
          mensaje: `PIN incorrecto. ${intentosRestantes} intentos restantes.`,
          codigo: "PIN_INCORRECTO",
          intentos_restantes: intentosRestantes,
        };
      }

      // PIN correcto
      await BarPinAttempt.registrar({
        restaurante_id,
        usuario_id,
        tipo_accion,
        exito: true,
        ip_address,
      });

      return {
        valido: true,
        mensaje: "PIN válido",
        codigo: "PIN_VALIDO",
      };
    } catch (error) {
      console.error("[barSecurityService.validarPin]", error);
      return {
        valido: false,
        mensaje: "Error validando PIN",
        codigo: "ERROR_INTERNO",
      };
    }
  },
};

module.exports = barSecurityService;