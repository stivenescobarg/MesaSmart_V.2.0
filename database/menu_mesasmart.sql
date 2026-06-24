-- ============================================================
-- MesaSmart — Tablas del Menú (módulo carta/bar)
-- Exportado: 2026-04-06
-- Tablas incluidas: categorias, subcategorias, productos,
--                   productos_opciones, opciones, quejas
-- ============================================================

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";
/*!40101 SET NAMES utf8mb4 */;

-- --------------------------------------------------------
-- Tabla: `categorias`
-- --------------------------------------------------------

CREATE TABLE `categorias` (
  `id` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `categorias` (`id`, `nombre`) VALUES
(1, 'Platos fuertes'),
(2, 'Entradas'),
(3, 'Platos típicos'),
(4, 'Bar'),
(5, 'Pastas'),
(6, 'Cortes'),
(7, 'Sushi'),
(8, 'Comida Vegana'),
(9, 'Quesos');

ALTER TABLE `categorias`
  ADD PRIMARY KEY (`id`);

ALTER TABLE `categorias`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

-- --------------------------------------------------------
-- Tabla: `subcategorias`
-- --------------------------------------------------------

CREATE TABLE `subcategorias` (
  `id` int(11) NOT NULL,
  `nombre` varchar(100) DEFAULT NULL,
  `categoria_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `subcategorias` (`id`, `nombre`, `categoria_id`) VALUES
(1, 'Licores', 4),
(2, 'Cervezas', 4),
(3, 'Jugos', 4),
(4, 'Micheladas', 4),
(5, 'Gaseosas', 4),
(6, 'Malteadas', 4);

ALTER TABLE `subcategorias`
  ADD PRIMARY KEY (`id`),
  ADD KEY `categoria_id` (`categoria_id`);

ALTER TABLE `subcategorias`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

ALTER TABLE `subcategorias`
  ADD CONSTRAINT `subcategorias_ibfk_1` FOREIGN KEY (`categoria_id`) REFERENCES `categorias` (`id`);

-- --------------------------------------------------------
-- Tabla: `opciones`
-- --------------------------------------------------------

CREATE TABLE `opciones` (
  `id` int(11) NOT NULL,
  `nombre` varchar(100) DEFAULT NULL,
  `producto_id` int(11) DEFAULT NULL,
  `precio` int(11) DEFAULT 0,
  `tipo` varchar(20) DEFAULT 'adiccion'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `opciones` (`id`, `nombre`, `producto_id`, `precio`, `tipo`) VALUES
(1, 'Papas a la francesa', NULL, 0, 'acompanamiento'),
(2, 'Papas al vapor', NULL, 0, 'acompanamiento'),
(3, 'Ensalada verde', NULL, 0, 'acompanamiento'),
(4, 'Papas al romero', NULL, 0, 'acompanamiento'),
(5, 'Puré de papa', NULL, 0, 'acompanamiento'),
(6, 'Ensalada mixta', NULL, 0, 'acompanamiento'),
(7, 'Arroz integral', NULL, 0, 'acompanamiento'),
(8, 'Arroz con ensalada', NULL, 0, 'acompanamiento'),
(9, 'Con arroz', NULL, 0, 'acompanamiento'),
(10, 'Con yuca', NULL, 0, 'acompanamiento'),
(11, 'Con arepa', NULL, 0, 'acompanamiento'),
(12, 'Con papa', NULL, 0, 'acompanamiento'),
(13, 'Spaghetti', NULL, 0, 'acompanamiento'),
(14, 'Fettuccine', NULL, 0, 'acompanamiento'),
(15, 'Penne', NULL, 0, 'acompanamiento'),
(16, 'Linguine', NULL, 0, 'acompanamiento'),
(17, 'Con aguacate', NULL, 0, 'acompanamiento'),
(18, 'Sin aguacate', NULL, 0, 'acompanamiento'),
(19, 'Papas al horno', NULL, 0, 'acompanamiento'),
(20, 'Ensalada de kale', NULL, 0, 'acompanamiento'),
(21, 'Dulces', NULL, 0, 'acompanamiento'),
(22, 'Saladas', NULL, 0, 'acompanamiento'),
(23, 'De carne', NULL, 0, 'acompanamiento'),
(24, 'De pollo', NULL, 0, 'acompanamiento'),
(25, 'De pipián', NULL, 0, 'acompanamiento'),
(26, 'Con azúcar', NULL, 0, 'acompanamiento'),
(27, 'Sin azúcar', NULL, 0, 'acompanamiento'),
(28, 'Con leche', NULL, 0, 'acompanamiento'),
(29, 'Queso extra', NULL, 3000, 'adiccion'),
(30, 'Tocineta', NULL, 5000, 'adiccion'),
(31, 'Aguacate extra', NULL, 4000, 'adiccion'),
(32, 'Salsa especial', NULL, 2000, 'adiccion'),
(33, 'Salsa extra', NULL, 2000, 'adiccion'),
(34, 'Queso fundido', NULL, 4000, 'adiccion'),
(35, 'Queso rallado', NULL, 2000, 'adiccion'),
(36, 'Mazorca adicional', NULL, 5000, 'adiccion'),
(37, 'Chorizo extra', NULL, 6000, 'adiccion'),
(38, 'Extra queso parmesano', NULL, 3000, 'adiccion'),
(39, 'Tocineta extra', NULL, 4000, 'adiccion'),
(40, 'Pollo grillado', NULL, 8000, 'adiccion'),
(41, 'Camarones', NULL, 12000, 'adiccion'),
(42, 'Salsa chimichurri', NULL, 4000, 'adiccion'),
(43, 'Salsa de pimienta', NULL, 4000, 'adiccion'),
(44, 'Hongos salteados', NULL, 6000, 'adiccion'),
(45, 'Queso azul', NULL, 5000, 'adiccion'),
(46, 'Cebolla caramelizada', NULL, 3000, 'adiccion'),
(47, 'Salsa spicy', NULL, 2000, 'adiccion'),
(48, 'Tobiko extra', NULL, 3000, 'adiccion'),
(49, 'Salsa de soya extra', NULL, 1000, 'adiccion'),
(50, 'Jengibre extra', NULL, 1500, 'adiccion'),
(51, 'Tofu marinado', NULL, 5000, 'adiccion'),
(52, 'Semillas de chia', NULL, 2000, 'adiccion'),
(53, 'Queso vegano', NULL, 4000, 'adiccion'),
(54, 'Vino de la casa (copa)', NULL, 18000, 'adiccion'),
(55, 'Pan baguette extra', NULL, 5000, 'adiccion'),
(56, 'Miel de trufa', NULL, 6000, 'adiccion'),
(57, 'Papas baby asadas', NULL, 6000, 'adiccion'),
(58, 'Manzana en rodajas', NULL, 3000, 'adiccion'),
(59, 'Chicharrón', NULL, 5000, 'adiccion'),
(60, 'Aguacate', NULL, 3000, 'adiccion'),
(61, 'Ají picante', NULL, 1000, 'adiccion'),
(62, 'Limón extra', NULL, 500, 'adiccion'),
(63, 'Arepa extra', NULL, 2000, 'adiccion'),
(64, 'Presa extra', NULL, 6000, 'adiccion'),
(65, 'Arroz extra', NULL, 2000, 'adiccion'),
(66, 'Chicharrón extra', NULL, 5000, 'adiccion'),
(67, 'Pan tostado', NULL, 3000, 'adiccion'),
(68, 'Arroz de coco', NULL, 4000, 'adiccion'),
(69, 'Extra parmesano', NULL, 3000, 'adiccion'),
(70, 'Salsa BBQ', NULL, 1500, 'adiccion'),
(71, 'Salsa rosada', NULL, 1500, 'adiccion'),
(72, 'Mantequilla extra', NULL, 1000, 'adiccion'),
(73, 'Ají extra', NULL, 500, 'adiccion'),
(74, 'Pan artesanal', NULL, 3000, 'adiccion');

ALTER TABLE `opciones`
  ADD PRIMARY KEY (`id`);

ALTER TABLE `opciones`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=75;

-- --------------------------------------------------------
-- Tabla: `productos`
-- --------------------------------------------------------

CREATE TABLE `productos` (
  `id` int(11) NOT NULL,
  `nombre` varchar(100) DEFAULT NULL,
  `descripcion` text DEFAULT NULL,
  `imagen` varchar(255) DEFAULT NULL,
  `precio` decimal(10,2) DEFAULT NULL,
  `categoria_id` int(11) DEFAULT NULL,
  `subcategoria_id` int(11) DEFAULT NULL,
  `destacado` tinyint(1) DEFAULT 0,
  `tiene_termino` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `productos` (`id`, `nombre`, `descripcion`, `imagen`, `precio`, `categoria_id`, `subcategoria_id`, `destacado`, `tiene_termino`) VALUES
(1,  'Hamburguesa Especial',    'Carne de res a la parrilla, pan artesanal, queso, lechuga y tomate.',                           'hamburguesa',  28000.00, 1, NULL, 0, 0),
(2,  'Alitas BBQ',              'Alitas crocantes bañadas en salsa BBQ ahumada. Con dip de queso azul.',                          'alitas',       32000.00, 1, NULL, 0, 0),
(3,  'Pechuga a la Plancha',    'Pechuga jugosa marinada a la plancha con especias, servida con guarnición.',                     'pechuga',      26000.00, 1, NULL, 0, 0),
(4,  'Sudado de Pollo',         'Pollo tierno en salsa criolla con papa, yuca y arroz blanco.',                                   'sudado',       24000.00, 1, NULL, 0, 0),
(5,  'Chicharrón',              'Chicharrón crocante de cerdo, acompañado con arepa y limón.',                                   'chicharron',   22000.00, 1, NULL, 0, 0),
(6,  'Patacones con Guacamole', 'Patacones crocantes con guacamole fresco, tomate y cilantro.',                                   'patacon',      18000.00, 2, NULL, 0, 0),
(7,  'Crispetas',               'Crispetas de maíz dulces o saladas, perfectas para compartir.',                                  'crispetas',     8000.00, 2, NULL, 0, 0),
(8,  'Deditos de Queso',        'Deditos crocantes rellenos de queso fundido. Imposible comer solo uno.',                         'deditos',      16000.00, 2, NULL, 0, 0),
(9,  'Empanadas',               'Empanadas de pipián, carne o pollo. Crujientes por fuera, jugosas por dentro.',                  'empanadas',    12000.00, 2, NULL, 0, 0),
(10, 'Carpaccio',               'Finas láminas de res con rúcula, alcaparras, parmesano y aceite de oliva.',                     'carpaccio',    28000.00, 2, NULL, 0, 0),
(11, 'Bandeja Paisa',           'Frijoles, arroz, carne molida, chicharrón, chorizo, huevo frito, arepa y aguacate.',            'bandeja',      36000.00, 3, NULL, 0, 0),
(12, 'Mondongo',                'Sopa tradicional de mondongo con papa, zanahoria, maíz y hierbas aromáticas.',                  'mondongo',     28000.00, 3, NULL, 0, 0),
(13, 'Sancocho',                'Sancocho trifásico con pollo, res y cerdo, papa, yuca, plátano y mazorca.',                     'sancocho',     32000.00, 3, NULL, 0, 0),
(14, 'Frijoles Antioqueños',    'Frijoles cargamanto con hogao, chicharrón y todo el sabor de Antioquia.',                       'frijoles',     22000.00, 3, NULL, 0, 0),
(15, 'Cazuela de Mariscos',     'Cazuela cremosa con camarones, calamares y mejillones en salsa de coco.',                       'cazuela',      42000.00, 3, NULL, 0, 0),
(16, 'Carbonara Clásica',       'Spaghetti con salsa de huevo, queso pecorino, guanciale crujiente y pimienta negra.',           'carbonara',    30000.00, 5, NULL, 0, 0),
(17, 'Pasta al Pesto',          'Linguine al dente con pesto de albahaca fresca, piñones tostados y parmesano.',                 'pesto',        27000.00, 5, NULL, 0, 0),
(18, 'Lasaña de Carne',         'Lasaña tradicional con carne de res, salsa bechamel y queso gratinado.',                        'carbonara',    32000.00, 5, NULL, 0, 0),
(19, 'Punta de Anca',           'Corte de res premium, jugoso y tierno. Cocinado a la parrilla de carbón.',                     'puntaDeAnca',  58000.00, 6, NULL, 0, 1),
(20, 'Solomito',                'Solomito de res tierno con mantequilla de hierbas y sal marina gruesa.',                        'solomito',     62000.00, 6, NULL, 0, 1),
(21, 'Ribeye 300g',             'Ribeye madurado en seco, 300g. Marmoleo perfecto, sabor inigualable.',                          'ribeye',       75000.00, 6, NULL, 0, 1),
(22, 'Roll California',         'Arroz de sushi, cangrejo, aguacate, pepino, tobiko. 8 piezas.',                                 'california',   26000.00, 7, NULL, 0, 0),
(23, 'Roll Spicy Tuna',         'Atún fresco con mayonesa spicy, aguacate y cebollín. 8 piezas.',                               'spicytuna',    32000.00, 7, NULL, 0, 0),
(24, 'Burrito Roll',            'Roll estilo burrito con arroz de sushi, pollo, aguacate y queso crema.',                        'burrito',      29000.00, 7, NULL, 0, 0),
(25, 'Bowl de Quinoa',          'Quinoa tricolor, garbanzos al horno, kale, tomates cherry y tahini de limón.',                 'quinoa',       24000.00, 8, NULL, 0, 0),
(26, 'Burger Vegana',           'Pan artesanal, medallón de lentejas y betabel, lechuga, tomate y mayonesa vegana.',             'burgerVeg',    26000.00, 8, NULL, 0, 0),
(27, 'Cazuela Vegana',          'Cazuela cremosa de verduras, garbanzos y leche de coco con hierbas frescas.',                   'cazuela',      22000.00, 8, NULL, 0, 0),
(28, 'Tabla de Quesos Premium', 'Selección de 4 quesos: brie, gouda añejo, manchego y azul. Con mermelada y frutos secos.',     'tablaQuesos',  45000.00, 9, NULL, 0, 0),
(29, 'Fondue de Queso',         'Fondue cremoso de gruyère y emmental con pan rústico, vegetales y charcutería.',               'fondue',       38000.00, 9, NULL, 0, 0),
(30, 'Deditos de Queso Quesos', 'Deditos crocantes rellenos de queso fundido. Perfectos para compartir.',                        'deditos',      16000.00, 9, NULL, 0, 0),
(31, 'Jugo Natural',            'Jugo natural de la fruta del día, sin azúcar o con azúcar al gusto.',                          'jugo',          8000.00, 4, 3,    0, 0),
(32, 'Aguardiente Antioqueño',  'Aguardiente antioqueño botella personal, frío.',                                                'aguardiente',  12000.00, 4, 1,    0, 0);

ALTER TABLE `productos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `categoria_id` (`categoria_id`),
  ADD KEY `subcategoria_id` (`subcategoria_id`);

ALTER TABLE `productos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=33;

ALTER TABLE `productos`
  ADD CONSTRAINT `productos_ibfk_1` FOREIGN KEY (`categoria_id`) REFERENCES `categorias` (`id`),
  ADD CONSTRAINT `productos_ibfk_2` FOREIGN KEY (`subcategoria_id`) REFERENCES `subcategorias` (`id`);

-- --------------------------------------------------------
-- Tabla: `productos_opciones`
-- --------------------------------------------------------

CREATE TABLE `productos_opciones` (
  `id` int(11) NOT NULL,
  `producto_id` int(11) DEFAULT NULL,
  `opcion_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `productos_opciones` (`id`, `producto_id`, `opcion_id`) VALUES
(1,1,1),(2,1,2),(3,1,3),(4,1,29),(5,1,30),(6,1,31),(7,1,32),
(8,2,1),(9,2,2),(10,2,33),(11,2,34),
(12,3,8),(13,3,2),(14,3,32),(15,3,31),
(16,4,9),(17,4,10),(18,4,59),(19,4,60),
(20,5,11),(21,5,12),(22,5,61),(23,5,62),
(24,6,35),
(25,7,21),(26,7,22),(27,7,72),
(28,8,70),(29,8,71),
(30,9,23),(31,9,24),(32,9,25),(33,9,73),
(34,10,69),
(35,11,36),(36,11,37),
(37,12,63),(38,12,62),
(39,13,64),(40,13,65),
(41,14,9),(42,14,11),(43,14,66),(44,14,60),
(45,15,67),(46,15,68),
(47,16,13),(48,16,14),(49,16,15),(50,16,38),(51,16,39),
(52,17,16),(53,17,14),(54,17,40),(55,17,41),
(56,18,29),(57,18,33),
(58,19,4),(59,19,5),(60,19,6),(61,19,42),(62,19,43),
(63,20,4),(64,20,7),(65,20,44),(66,20,46),
(67,21,4),(68,21,5),(69,21,45),(70,21,42),
(71,22,47),(72,22,48),
(73,23,49),(74,23,50),
(75,24,47),(76,24,29),
(77,25,17),(78,25,18),(79,25,51),(80,25,52),
(81,26,19),(82,26,20),(83,26,53),(84,26,31),
(85,27,74),(86,27,7),
(87,28,54),(88,28,55),(89,28,56),
(90,29,57),(91,29,58),
(92,30,70),(93,30,71),
(94,31,26),(95,31,27),(96,31,28),
(97,32,62);

ALTER TABLE `productos_opciones`
  ADD PRIMARY KEY (`id`),
  ADD KEY `producto_id` (`producto_id`),
  ADD KEY `opcion_id` (`opcion_id`);

ALTER TABLE `productos_opciones`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=98;

ALTER TABLE `productos_opciones`
  ADD CONSTRAINT `productos_opciones_ibfk_1` FOREIGN KEY (`producto_id`) REFERENCES `productos` (`id`),
  ADD CONSTRAINT `productos_opciones_ibfk_2` FOREIGN KEY (`opcion_id`) REFERENCES `opciones` (`id`);

-- --------------------------------------------------------
-- Tabla: `quejas`
-- --------------------------------------------------------

CREATE TABLE `quejas` (
  `id` int(11) NOT NULL,
  `mesa` varchar(20) DEFAULT NULL,
  `mensaje` text NOT NULL,
  `fecha` timestamp NOT NULL DEFAULT current_timestamp(),
  `estado` varchar(20) DEFAULT 'pendiente'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `quejas` (`id`, `mesa`, `mensaje`, `fecha`, `estado`) VALUES
(1, '2', 'muy poquito',  '2026-04-02 23:47:34', 'pendiente'),
(2, '2', 'hola bello',   '2026-04-03 08:18:30', 'pendiente'),
(3, '8', 'Hola kerry',   '2026-04-03 08:22:04', 'pendiente');

ALTER TABLE `quejas`
  ADD PRIMARY KEY (`id`);

ALTER TABLE `quejas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

COMMIT;
