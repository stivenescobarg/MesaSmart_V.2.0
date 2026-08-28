-- MesaSmart · Módulo Bar - Auditoría y Seguridad
-- Ejecutar en la base de datos de MesaSmart

-- Tabla 1: Auditoría de cambios en bar
CREATE TABLE IF NOT EXISTS bar_audit_logs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  accion VARCHAR(50) NOT NULL,
  producto_id INT UNSIGNED NULL,
  orden_id BIGINT UNSIGNED NULL,
  cantidad_antes DECIMAL(10, 2) NULL,
  cantidad_despues DECIMAL(10, 2) NULL,
  cambio DECIMAL(10, 2) NULL,
  usuario_id INT UNSIGNED NULL,
  usuario_nombre VARCHAR(100) NULL,
  descripcion TEXT NULL,
  ip_address VARCHAR(45) NULL,
  timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_accion (accion),
  INDEX idx_producto_id (producto_id),
  INDEX idx_orden_id (orden_id),
  INDEX idx_timestamp (timestamp),
  INDEX idx_usuario_id (usuario_id),
  FOREIGN KEY (orden_id) REFERENCES ordenes_bar(id) ON DELETE SET NULL,
  FOREIGN KEY (producto_id) REFERENCES stock_productos(id) ON DELETE SET NULL
);

-- Tabla 2: Intentos de PIN (para rate limiting)
CREATE TABLE IF NOT EXISTS bar_pin_attempts (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT UNSIGNED NULL,
  tipo_accion VARCHAR(50) NOT NULL,
  exito BOOLEAN DEFAULT FALSE,
  ip_address VARCHAR(45) NULL,
  timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_usuario_id (usuario_id),
  INDEX idx_timestamp (timestamp),
  INDEX idx_exito (exito),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
);

-- Agregar usuario_id a ordenes_bar (si no existe)
ALTER TABLE ordenes_bar 
ADD COLUMN IF NOT EXISTS usuario_id INT UNSIGNED NULL AFTER observacion,
ADD CONSTRAINT fk_ordenes_bar_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL;

-- Verificación
SELECT 'Tablas creadas exitosamente' as status;