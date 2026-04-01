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