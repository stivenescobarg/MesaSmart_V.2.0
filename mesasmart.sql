-- ══════════════════════════════════════════════════════════════════
-- MesaSmart — Script SQL completo (MySQL 8 / XAMPP)
-- Ejecutar en phpMyAdmin o: mysql -u root -p < mesasmart.sql
-- ══════════════════════════════════════════════════════════════════

CREATE DATABASE IF NOT EXISTS mesasmart
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE mesasmart;

-- 1. USUARIOS
CREATE TABLE usuarios (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre      VARCHAR(100)  NOT NULL,
  correo      VARCHAR(150)  NOT NULL UNIQUE,
  password    VARCHAR(255)  NOT NULL,
  rol         ENUM('admin','cocina','bartender') NOT NULL DEFAULT 'cocina',
  numero      TINYINT UNSIGNED NOT NULL DEFAULT 1,
  activo      BOOLEAN NOT NULL DEFAULT TRUE,
  creado_en   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. SESIONES (auditoría + blacklist JWT)
CREATE TABLE sesiones (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  usuario_id   INT UNSIGNED NOT NULL,
  token_jti    VARCHAR(100) NOT NULL UNIQUE,
  ip           VARCHAR(45),
  dispositivo  VARCHAR(255),
  inicio       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fin          DATETIME NULL,
  duracion_seg INT UNSIGNED NULL,
  activa       BOOLEAN NOT NULL DEFAULT TRUE,
  CONSTRAINT fk_ses_usr FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- 3. MESAS
CREATE TABLE mesas (
  id        INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre    VARCHAR(50) NOT NULL,
  estado    ENUM('libre','ocupada','reservada') NOT NULL DEFAULT 'libre',
  activa    BOOLEAN NOT NULL DEFAULT TRUE,
  creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 4. CAJA
CREATE TABLE caja (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  usuario_id    INT UNSIGNED NOT NULL,
  monto_inicial DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  monto_final   DECIMAL(12,2) NULL,
  total_ventas  DECIMAL(12,2) NULL,
  estado        ENUM('abierta','cerrada') NOT NULL DEFAULT 'abierta',
  apertura      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  cierre        DATETIME NULL,
  CONSTRAINT fk_caja_usr FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- 5. PEDIDOS
CREATE TABLE pedidos (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  mesa_id     INT UNSIGNED NOT NULL,
  caja_id     INT UNSIGNED NULL,
  estado      ENUM('pendiente','en_preparacion','listo','pagado','cancelado') NOT NULL DEFAULT 'pendiente',
  total       DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  observacion TEXT NULL,
  creado_en   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_ped_mesa FOREIGN KEY (mesa_id) REFERENCES mesas(id),
  CONSTRAINT fk_ped_caja FOREIGN KEY (caja_id) REFERENCES caja(id)
);

-- 6. DETALLE PEDIDO
CREATE TABLE detalle_pedido (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  pedido_id   INT UNSIGNED NOT NULL,
  nombre      VARCHAR(150) NOT NULL,
  cantidad    TINYINT UNSIGNED NOT NULL DEFAULT 1,
  precio      DECIMAL(10,2) NOT NULL,
  categoria   ENUM('comida','bebida','otro') NOT NULL DEFAULT 'comida',
  observacion VARCHAR(255) NULL,
  CONSTRAINT fk_det_ped FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE
);

-- 7. VENTAS
CREATE TABLE ventas (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  caja_id     INT UNSIGNED NOT NULL,
  pedido_id   INT UNSIGNED NULL,
  mesa_nombre VARCHAR(50)  NOT NULL,
  total       DECIMAL(12,2) NOT NULL,
  metodo_pago ENUM('efectivo','tarjeta','transferencia') NOT NULL,
  usuario_id  INT UNSIGNED NULL,
  fecha       DATE NOT NULL,
  hora        TIME NOT NULL,
  creado_en   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_ven_caja FOREIGN KEY (caja_id)    REFERENCES caja(id),
  CONSTRAINT fk_ven_ped  FOREIGN KEY (pedido_id)  REFERENCES pedidos(id),
  CONSTRAINT fk_ven_usr  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- 8. DETALLE VENTA
CREATE TABLE detalle_venta (
  id       INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  venta_id INT UNSIGNED NOT NULL,
  nombre   VARCHAR(150) NOT NULL,
  cantidad TINYINT UNSIGNED NOT NULL,
  precio   DECIMAL(10,2) NOT NULL,
  CONSTRAINT fk_dventa FOREIGN KEY (venta_id) REFERENCES ventas(id) ON DELETE CASCADE
);

-- 9. HISTORIAL CAJA
CREATE TABLE historial_caja (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  caja_id        INT UNSIGNED NOT NULL UNIQUE,
  fecha          DATE NOT NULL,
  monto_inicial  DECIMAL(12,2) NOT NULL,
  total_ventas   DECIMAL(12,2) NOT NULL,
  monto_final    DECIMAL(12,2) NOT NULL,
  total_efectivo DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  total_tarjeta  DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  total_transf   DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  cant_ventas    SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  cerrado_por    INT UNSIGNED NULL,
  CONSTRAINT fk_hcaja_caja FOREIGN KEY (caja_id)     REFERENCES caja(id),
  CONSTRAINT fk_hcaja_usr  FOREIGN KEY (cerrado_por) REFERENCES usuarios(id)
);

-- ÍNDICES
CREATE INDEX idx_ped_mesa    ON pedidos(mesa_id);
CREATE INDEX idx_ped_estado  ON pedidos(estado);
CREATE INDEX idx_ven_caja    ON ventas(caja_id);
CREATE INDEX idx_ven_fecha   ON ventas(fecha);
CREATE INDEX idx_ses_activa  ON sesiones(activa);

-- MESAS INICIALES
INSERT INTO mesas (nombre) VALUES
  ('Mesa 1'),('Mesa 2'),('Mesa 3'),('Mesa 4'),('Mesa 5'),
  ('Mesa 6'),('Mesa 7'),('Mesa 8'),('Mesa 9'),('Mesa 10');

-- NOTA: Los usuarios se crean ejecutando: node src/config/seed.js

-- ══════════════════════════════════════════════════════════════════
-- MesaSmart — Actualización BD para nuevas funcionalidades
-- Ejecutar en phpMyAdmin sobre la BD mesasmart existente
-- ══════════════════════════════════════════════════════════════════

USE mesasmart;

-- ── TABLA EGRESOS ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS egresos (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  caja_id     INT UNSIGNED NOT NULL,
  usuario_id  INT UNSIGNED NOT NULL,
  descripcion VARCHAR(255) NOT NULL,
  monto       DECIMAL(12,2) NOT NULL,
  fecha       DATE NOT NULL,
  hora        TIME NOT NULL,
  creado_en   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_egreso_caja FOREIGN KEY (caja_id)    REFERENCES caja(id),
  CONSTRAINT fk_egreso_usr  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

CREATE INDEX idx_egresos_caja  ON egresos(caja_id);
CREATE INDEX idx_egresos_fecha ON egresos(fecha);

-- ── AGREGAR total_egresos A historial_caja ────────────────────────
-- Si la columna ya existe, este ALTER será ignorado por el IF NOT EXISTS
ALTER TABLE historial_caja
  ADD COLUMN IF NOT EXISTS total_egresos  DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS efectivo_neto  DECIMAL(12,2) NOT NULL DEFAULT 0.00;

-- Verificar que todo quedó bien
SELECT 'egresos' as tabla, COUNT(*) as registros FROM egresos
UNION ALL
SELECT 'historial_caja', COUNT(*) FROM historial_caja;

-- ══════════════════════════════════════════════════════════════════
-- MesaSmart — Módulo de Stock / Inventario
-- Ejecutar en phpMyAdmin sobre la BD mesasmart existente
-- ══════════════════════════════════════════════════════════════════

USE mesasmart;

-- ── PRODUCTOS DE INVENTARIO ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS stock_productos (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre          VARCHAR(150) NOT NULL,
  proveedor       VARCHAR(150) NOT NULL,
  categoria       ENUM('cocina','bar') NOT NULL DEFAULT 'cocina',
  unidad          VARCHAR(30)  NOT NULL DEFAULT 'unidad',  -- unidad, kg, litro, caja...
  cantidad_actual DECIMAL(10,2) NOT NULL DEFAULT 0,
  cantidad_minima DECIMAL(10,2) NOT NULL DEFAULT 5,        -- umbral de alerta
  activo          BOOLEAN NOT NULL DEFAULT TRUE,
  creado_en       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ── MOVIMIENTOS DE STOCK (ingresos y ajustes) ─────────────────────
CREATE TABLE IF NOT EXISTS stock_movimientos (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  producto_id  INT UNSIGNED NOT NULL,
  usuario_id   INT UNSIGNED NOT NULL,
  tipo         ENUM('ingreso','ajuste','egreso') NOT NULL DEFAULT 'ingreso',
  cantidad     DECIMAL(10,2) NOT NULL,
  observacion  VARCHAR(255) NULL,
  fecha        DATE NOT NULL,
  creado_en    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_mov_producto FOREIGN KEY (producto_id)
    REFERENCES stock_productos(id) ON DELETE CASCADE,
  CONSTRAINT fk_mov_usuario FOREIGN KEY (usuario_id)
    REFERENCES usuarios(id)
);

-- ÍNDICES
CREATE INDEX idx_stock_categoria ON stock_productos(categoria);
CREATE INDEX idx_stock_activo    ON stock_productos(activo);
CREATE INDEX idx_mov_producto    ON stock_movimientos(producto_id);
CREATE INDEX idx_mov_fecha       ON stock_movimientos(fecha);

-- DATOS INICIALES DE EJEMPLO
INSERT INTO stock_productos (nombre, proveedor, categoria, unidad, cantidad_actual, cantidad_minima) VALUES
  ('Aceite de cocina',      'Distribuidora El Maíz',  'cocina', 'litro',  8,  5),
  ('Sal marina',            'Distribuidora El Maíz',  'cocina', 'kg',     12, 3),
  ('Arroz blanco',          'Granos del Valle',       'cocina', 'kg',     25, 10),
  ('Pollo entero',          'Avícola San José',       'cocina', 'kg',     4,  8),
  ('Carne de res',          'Frigorífico Norte',      'cocina', 'kg',     3,  6),
  ('Papa criolla',          'Verduras Frescas SAS',   'cocina', 'kg',     15, 5),
  ('Aguardiente Antioqueño','Licores del Eje',        'bar',    'botella', 6,  4),
  ('Cerveza Club Colombia', 'Distribuidora Bavaria',  'bar',    'unidad', 48, 24),
  ('Ron Viejo de Caldas',   'Licores del Eje',        'bar',    'botella', 2,  3),
  ('Gaseosa 2L',            'Coca-Cola FEMSA',        'bar',    'unidad', 10, 6),
  ('Agua sin gas 500ml',    'Postobón',               'bar',    'unidad', 3,  12),
  ('Jugo Hit mango',        'Postobón',               'bar',    'unidad', 8,  6);

-- Verificar
SELECT id, nombre, categoria, cantidad_actual, cantidad_minima,
       CASE WHEN cantidad_actual <= cantidad_minima THEN '⚠️ ALERTA' ELSE '✅ OK' END as estado
FROM stock_productos ORDER BY categoria, nombre;

-- ══════════════════════════════════════════════════════════════════
-- MesaSmart — Plano del restaurante
-- Ejecutar sobre la BD mesasmart EXISTENTE
-- Solo agrega lo que falta: tabla zonas + columnas en mesas
-- ══════════════════════════════════════════════════════════════════

USE mesasmart;

-- ── 1. TABLA ZONAS ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS zonas (
  id        INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre    VARCHAR(80)  NOT NULL,
  color     VARCHAR(20)  NOT NULL DEFAULT '#f59e0b',
  orden     TINYINT UNSIGNED NOT NULL DEFAULT 0,
  activa    BOOLEAN NOT NULL DEFAULT TRUE,
  creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Zonas iniciales de ejemplo (puedes cambiarlas)
INSERT INTO zonas (nombre, color, orden) VALUES
  ('Salón principal', '#f59e0b', 1),
  ('Terraza',         '#22c55e', 2),
  ('VIP',             '#a855f7', 3),
  ('Bar',             '#3b82f6', 4);

-- ── 2. AGREGAR COLUMNAS A MESAS ──────────────────────────────────
-- Si alguna columna ya existe, MySQL la ignora con IF NOT EXISTS
ALTER TABLE mesas
  ADD COLUMN IF NOT EXISTS zona_id   INT UNSIGNED NULL,
  ADD COLUMN IF NOT EXISTS capacidad TINYINT UNSIGNED NOT NULL DEFAULT 4,
  ADD COLUMN IF NOT EXISTS pos_x     SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pos_y     SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS forma     ENUM('cuadrada','redonda') NOT NULL DEFAULT 'cuadrada';

-- ── 3. FOREIGN KEY zonas → mesas ─────────────────────────────────
-- Solo agregar si no existe ya
SET @fk_exists = (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = 'mesasmart'
    AND TABLE_NAME        = 'mesas'
    AND CONSTRAINT_NAME   = 'fk_mesa_zona'
);

SET @sql = IF(@fk_exists = 0,
  'ALTER TABLE mesas ADD CONSTRAINT fk_mesa_zona FOREIGN KEY (zona_id) REFERENCES zonas(id) ON DELETE SET NULL',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ── 4. ASIGNAR ZONA POR DEFECTO A MESAS EXISTENTES ───────────────
UPDATE mesas SET zona_id = 1 WHERE zona_id IS NULL AND activa = TRUE;

-- ── 5. POSICIONES INICIALES EN EL PLANO ──────────────────────────
-- Distribuye las 10 primeras mesas en 2 filas de 5
UPDATE mesas SET pos_x =  20, pos_y =  20 WHERE id = 1;
UPDATE mesas SET pos_x = 160, pos_y =  20 WHERE id = 2;
UPDATE mesas SET pos_x = 300, pos_y =  20 WHERE id = 3;
UPDATE mesas SET pos_x = 440, pos_y =  20 WHERE id = 4;
UPDATE mesas SET pos_x = 580, pos_y =  20 WHERE id = 5;
UPDATE mesas SET pos_x =  20, pos_y = 160 WHERE id = 6;
UPDATE mesas SET pos_x = 160, pos_y = 160 WHERE id = 7;
UPDATE mesas SET pos_x = 300, pos_y = 160 WHERE id = 8;
UPDATE mesas SET pos_x = 440, pos_y = 160 WHERE id = 9;
UPDATE mesas SET pos_x = 580, pos_y = 160 WHERE id = 10;

-- Si tienes más mesas (id > 10) se quedan en pos 0,0
-- Puedes reposicionarlas desde el panel de Admin → Mesas → vista Plano

-- ── VERIFICACIÓN FINAL ────────────────────────────────────────────
SELECT
  m.id,
  m.nombre,
  m.estado,
  m.zona_id,
  z.nombre  AS zona,
  z.color   AS zona_color,
  m.capacidad,
  m.pos_x,
  m.pos_y,
  m.forma
FROM mesas m
LEFT JOIN zonas z ON z.id = m.zona_id
WHERE m.activa = TRUE
ORDER BY m.id;