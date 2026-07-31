-- MesaSmart · módulo de bar
-- Migración aditiva: puede ejecutarse sobre la base actual sin eliminar información.
-- Selecciona la base de datos configurada en tu entorno antes de ejecutar este archivo.

CREATE TABLE IF NOT EXISTS ordenes_bar (
  id             BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  mesa           VARCHAR(80) NOT NULL,
  items          JSON NOT NULL,
  observacion    VARCHAR(500) NULL,
  estado         ENUM('pendiente','en_preparacion','listo','cancelado') NOT NULL DEFAULT 'pendiente',
  creado_en      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  iniciado_en    DATETIME NULL,
  listo_en       DATETIME NULL,
  actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_ordenes_bar_estado_fecha (estado, creado_en),
  INDEX idx_ordenes_bar_listo_en (listo_en)
);

-- Verificación posterior a ejecutar la migración.
SELECT TABLE_NAME
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ordenes_bar';
