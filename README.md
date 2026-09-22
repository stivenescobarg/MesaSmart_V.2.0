# 🍽️ MesaSmart

**Plataforma SaaS B2B para la gestión integral de restaurantes** — mesas, pedidos, cocina, barra, caja, inventario, proveedores, finanzas, reportes y administración, con pedido autónomo del cliente vía QR y arquitectura multi-tenant.

Proyecto desarrollado en el marco de la formación **SENA — Tecnología en Análisis y Desarrollo de Software (ADSO)**.

---

## 📌 Tabla de contenido

- [Información del proyecto](#-información-del-proyecto)
- [Equipo](#-equipo)
- [¿Qué es MesaSmart?](#-qué-es-mesasmart)
- [Módulos y funcionalidades](#-módulos-y-funcionalidades)
- [Roles del sistema](#-roles-del-sistema)
- [Arquitectura multi-tenant](#-arquitectura-multi-tenant)
- [Menú digital por QR](#-menú-digital-por-qr)
- [Seguridad](#-seguridad)
- [Stack tecnológico](#-stack-tecnológico)
- [Arquitectura de despliegue](#-arquitectura-de-despliegue)
- [Estructura del repositorio](#-estructura-del-repositorio)
- [Modelo de datos](#-modelo-de-datos)
- [Puesta en marcha (desarrollo local)](#-puesta-en-marcha-desarrollo-local)
- [Variables de entorno](#-variables-de-entorno)
- [Pruebas](#-pruebas)
- [Despliegue en producción](#-despliegue-en-producción)
- [Planes comerciales](#-planes-comerciales)
- [Identidad visual](#-identidad-visual)
- [Estado actual y hoja de ruta](#-estado-actual-y-hoja-de-ruta)
- [Licencia](#-licencia)

---

## 📋 Información del proyecto

| Campo | Valor |
|---|---|
| Proyecto | MesaSmart |
| Programa | Tecnología en Análisis y Desarrollo de Software (ADSO) |
| Ficha | 3144585 |
| Regional | Antioquia |
| Centro | CTMA |
| Instructor | Juan Carlos Quintero |
| Repositorio principal | `stivenescobarg/MesaSmart_V.2.0` |
| Dominio de producción | [mesasmart.app](https://mesasmart.app) |

## 👥 Equipo

| Integrante | Rol |
|---|---|
| **Stiven Escobar Gómez** | Líder de proyecto / Analista |
| **Sara García** | Desarrollo Backend |
| **Kerry Herrera** | QA / Aseguramiento de calidad |

---

## 🧾 ¿Qué es MesaSmart?

MesaSmart **no es una app para consumidores**: es una plataforma **B2B** para que un restaurante administre toda su operación interna desde un solo sistema. Centraliza:

- Mesas y zonas del salón
- Pedidos (por mesero y por QR del cliente)
- Menú digital y catálogo de productos
- Cocina y barra (colas de preparación en tiempo real)
- Caja, arqueo y cierre de turno
- Ventas, pagos, división de cuentas, descuentos y servicio
- Inventario, stock y proveedores
- Finanzas, auditoría y reportes (PDF / Excel)
- Administración de usuarios y roles

El proyecto está evolucionando hacia un modelo **SaaS multi-tenant**, donde distintos restaurantes operan de forma aislada dentro de la misma plataforma, cada uno con sus propios usuarios, mesas, menú y configuración.

> MesaSmart no crea cuentas para los clientes finales del restaurante. El cliente que escanea el QR no se registra, no tiene contraseña y no aparece en la tabla `usuarios` (esa tabla es exclusiva del personal del restaurante).

## 🧩 Módulos y funcionalidades

### Operación
- **Mesas y zonas**: salón principal, terraza, bar, privado, delivery, con layout visual y estados por mesa.
- **Pedidos**: creación por mesero o por QR del cliente, con productos, cantidades, observaciones (ej. "sin cebolla") y opciones/modificadores.
- **Ventana de modificación**: el cliente puede editar su pedido durante ~5 minutos tras enviarlo.
- **Cocina (KDS)**: pantalla de cocina en tiempo real con estados `Nuevo → Preparando → Listo` (`KitchenDashboard.jsx`).
- **Barra**: flujo independiente para bebidas/bartender, sin mezclarse con la cola de cocina.
- **Detalle de mesa** (`DetalleMesa.jsx`): ver productos, cobrar, mover productos entre cuentas, cambiar cantidades, aplicar descuentos y elegir método de pago.

### Ventas y caja
- **División de cuentas**: mover productos específicos a subcuentas para pagos separados.
- **Descuentos rápidos**: 10 %, 20 %, 30 %, 50 % o personalizado.
- **Servicio**: 10 % opcional sobre la cuenta, reflejado en caja, reportes y PDF.
- **Propina**: manejo independiente del servicio.
- **Métodos de pago**: efectivo, tarjeta, transferencia — separados en caja.
- **Caja**: apertura, cierre, ventas por método de pago, egresos, historial (`historial_caja`).
- **Arqueo de caja**: cálculo de efectivo esperado como

  ```
  efectivo esperado = monto inicial + ventas en efectivo − egresos
  ```

  comparado contra el efectivo contado físicamente (por denominación de billetes y monedas) para determinar sobrante, faltante o cuadre exacto. Genera reporte en PDF al cerrar.

### Administración y finanzas
- **Inventario**: productos, categorías, subcategorías, control de stock y alertas de bajo inventario.
- **Opciones de producto**: modificadores por producto (ej. hamburguesa → sin cebolla, extra queso, extra tocineta).
- **Proveedores**: registro de proveedores y facturas, con estados `Pendiente / Parcial / Pagada`.
- **Dashboard financiero**: ingresos, gastos, rentabilidad y comportamiento del negocio.
- **Dashboard operativo**: gráficas con Recharts (ej. ventas de los últimos 7 días) y KPIs de ventas, caja, ingresos y servicio.
- **Reportes**: ventas, métodos de pago, indicadores financieros; exportables a **PDF** (`backend/src/utils/generarPDF.js`) y **Excel** por rango de fechas.
- **Quejas**: módulo para registrar y gestionar reclamos del restaurante.
- **Auditoría**: trazabilidad de cambios (usuario, acción, fecha/hora, valor anterior y nuevo) para modificaciones sensibles como cambios de precio.

## 🔐 Roles del sistema

| Rol | Alcance |
|---|---|
| **Super Admin** | Nivel global de la plataforma: crea y administra restaurantes, planes, servicios y pagos. Provisiona el restaurante y entrega las credenciales iniciales al Admin. |
| **Administrador** | Gestiona su restaurante: usuarios, menú, mesas, finanzas y configuración general. |
| **Caja** | Confirmación de pedidos, cobro, cierre de turno y arqueo. |
| **Cocina** | Cola de preparación de platos en tiempo real. |
| **Bartender** | Cola de preparación de bebidas y barra. |
| **Cliente (vía QR)** | Sin cuenta ni contraseña: solo escanea, ve el menú y hace su pedido. |

Flujo de aprovisionamiento:

```
Super Admin → crea restaurante → entrega credenciales → Admin
Admin → crea y gestiona usuarios de su restaurante
```

## 🏢 Arquitectura multi-tenant

MesaSmart está diseñado para que **múltiples restaurantes** operen sobre la misma plataforma sin que sus datos se mezclen:

```
Restaurante A                Restaurante B
 ├── usuarios                 ├── usuarios
 ├── mesas                    ├── mesas
 ├── pedidos                  ├── pedidos
 ├── productos                ├── productos
 └── ventas                   └── ventas
```

El aislamiento se garantiza mediante:
- **`restaurante_id`** presente en cada tabla clave del dominio.
- **`tenantMiddleware`**, que valida en cada request que el usuario autenticado solo pueda leer/escribir datos de su propio restaurante.

## 📱 Menú digital por QR

Cada mesa tiene un QR que abre el menú digital del restaurante directamente en el navegador — **sin instalar ninguna app**:

```
Cliente → escanea QR → menú digital → selecciona productos
        → agrega observaciones → envía pedido → restaurante recibe el pedido
```

La URL del menú evolucionó para no exponer identificadores internos:

- **Antes**: `/menu/:restaurante_id/:mesa_id` (IDs autoincrementales, adivinables).


Flujo interno del pedido (caja como filtro antes de producción):

```
Cliente → Pedido → Caja / confirmación → Cocina / Barra → Pedido listo
```

## 🛡️ Seguridad

### Autenticación y autorización
- **JWT** para autenticación de todo el personal del restaurante (admin, caja, cocina, bartender) y del Super Admin.
- **Roles** validados en el backend en cada ruta protegida (`roleMiddleware.js`, `roleSuperAdmin.js`).
- Aislamiento **multi-tenant** reforzado con `tenantMiddleware` para evitar fuga de datos entre restaurantes.

### Seguridad del QR de mesa (anti-IDOR)

La URL del QR era pública y usaba identificadores autoincrementales, lo que permitía dos ataques:

1. **IDOR / enumeración** — cambiar el ID en la URL para ver el menú de otro restaurante.
2. **Reutilización indefinida del link** — seguir haciendo pedidos desde una URL conocida, sin haber escaneado el QR físico en ese momento.

Se resolvió con **dos capas**:

**Capa 1 — Token HMAC anti-IDOR**
Cada QR incluye un parámetro `?t=<token>` firmado con **HMAC-SHA256** sobre `restaurante_id + mesa_id`, con un secreto (`QR_SECRET`) que solo vive en el servidor.
- `qrToken.js` genera y verifica el token, comparando con `crypto.timingSafeEqual` para evitar *timing attacks*.
- `qrTokenMiddleware.js` valida el token en cada endpoint público del flujo de cliente. Un JWT de admin válido del mismo restaurante puede pasar sin token (bypass para el panel administrativo).
- Efecto: ya no es posible adivinar o enumerar mesas cambiando IDs en la URL.

**Capa 2 — Confirmación manual del pedido**
En vez de rotar o expirar el token (lo que complicaría el QR físico impreso), todo pedido que entra por QR nace en estado `pendiente_confirmacion`, invisible para cocina/barra hasta que un mesero o admin lo aprueba.
- Nuevas rutas: `PATCH /pedidos-cocina/:id/confirmar` y `GET /pedidos-cocina/por-confirmar` (equivalentes en `barRoutes.js` / `barOrderService.js` para el bar).
- En el panel admin (`Mesas.jsx`), cada mesa muestra un badge 🔔 con la cantidad de pedidos por confirmar, y un modal (`ModalConfirmarPedidos`) permite revisarlos y aprobarlos con un clic.
- Los pedidos creados manualmente por el mesero (no por QR) nacen directamente en `pendiente`, sin pasar por esta validación.
- El flujo de pago no se modificó.

**CORS (desarrollo vs. producción)**
- En desarrollo, el backend permite dinámicamente cualquier subdominio `*.ngrok-free.dev` / `*.ngrok-free.app`, **solo si `NODE_ENV !== "production"`**.
- En producción (Azure, `mesasmart.app`), esa regla nunca se evalúa; el CORS depende exclusivamente de `CORS_ORIGIN`.
- Un middleware de errores convierte los rechazos de CORS en `403` con mensaje claro, en vez de un `500` genérico.

**Pendiente (bajo riesgo):** aplicar el mismo criterio de protección anti-IDOR a `quejaController.js` / `quejaRoutes.js`.

---

## 🛠️ Stack tecnológico

### Frontend
- **React** + **Vite**
- JavaScript / JSX
- **Recharts** para gráficas del dashboard
- Puerto de desarrollo: `5173`

### Backend
- **Node.js** + **Express** 5.2.1
- **JWT** para autenticación
- **MySQL** como base de datos
- **Swagger** para documentación de la API *(actualmente desactualizado, no es prioridad)*
- **dotenv** para variables de entorno
- **Jest** para pruebas unitarias e integración
- **Nodemon** en desarrollo
- Puerto: `3001`
- Entrada principal: `backend/src/server.js`

### Base de datos e infraestructura
- **MySQL**
- **Azure Database for MySQL — Servidor flexible**, administrada mediante **DBeaver**
- **Docker** y **Docker Compose** para contenerización
- **Cloudinary** para el almacenamiento de imágenes del menú

### Despliegue
- **Frontend** → Azure Static Web Apps
- **Backend** → Azure Container Apps (contenedores)
- **Base de datos** → Azure Database for MySQL (servidor flexible)
- **Dominio** → `mesasmart.app` (adquirido en Name.com)

## ☁️ Arquitectura de despliegue

```
                     Usuario web
                          │
                          ▼
              Azure Static Web Apps
                          │
                    React + Vite
                          │
                  HTTPS · API REST + JWT
                          │
                          ▼
              Azure Container Apps
                          │
                  Node.js + Express
                          │
              ┌───────────┼───────────┐
              ▼           ▼           ▼
    Azure Database    Cloudinary    DBeaver
    for MySQL         (imágenes     (administración
    (flexible)         del menú)     de la BD)
```

Todos los componentes viven en el mismo grupo de recursos de Azure (`rg-mesasmart-prod`). El frontend y el backend están completamente separados y se comunican vía API REST autenticada con JWT; el frontend **nunca** accede directamente a MySQL.

> **Nota de evolución:** la base de datos inició en Aiven MySQL y fue migrada a **Azure Database for MySQL** para integrar toda la infraestructura en Azure y aprovechar los beneficios del GitHub Student Developer Pack.

## 📁 Estructura del repositorio

```
MesaSmart/
├── .github/                       # Workflows / configuración de GitHub
├── backend/
│   ├── src/
│   │   ├── config/                # cloudinary.js, db.js, planes.js, seed.js, swagger.js
│   │   ├── controllers/           # adminController.js, quejaController.js, etc.
│   │   ├── database/
│   │   │   └── migrations/        # migraciones SQL versionadas
│   │   ├── middleware/            # authMiddleware.js, tenantMiddleware.js,
│   │   │                          # roleMiddleware.js, roleSuperAdmin.js,
│   │   │                          # requierePlan.js, qrTokenMiddleware.js,
│   │   │                          # publicTenantMiddleware.js
│   │   ├── models/                # Restaurante.js, Mesa.js, Zona.js, User.js,
│   │   │                          # Caja.js, Egresos.js, Producto.js, Menu.js,
│   │   │                          # Ingrediente.js, Stock.js, FacturaProveedor.js,
│   │   │                          # OrdenBar.js, PedidoBar.js, BarActivityLog.js,
│   │   │                          # BarVisitAttempt.js, Sesion.js, Proveedor.js
│   │   ├── routes/                 # admin.js, auth.js, authRoutes.js,
│   │   │                          # ingredienteRoutes.js, pedidoBar.js,
│   │   │                          # quejaRoutes.js, upload.js
│   │   ├── services/               # barInventoryService.js, barOrderService.js,
│   │   │                          # barSecurityService.js, qrService.js, qrToken.js
│   │   ├── utils/                  # generarPDF.js
│   │   ├── app.js
│   │   └── server.js               # punto de entrada del backend
│   ├── tests/
│   │   └── integration/
│   │       ├── globalSetup.js      # genera .test-context.json para compartir
│   │       └── .test-context.json  #   contexto entre pruebas
│   ├── database/                   # scripts / dumps de base de datos
│   ├── documents/                  # documentación interna del proyecto
│   ├── respaldo/                   # respaldos de código
│   ├── .env / .env.example / .env.test
│   ├── .dockerignore
│   ├── Dockerfile
│   ├── jest.integration.config.js
│   ├── jest.unit.config.js
│   ├── seedMenu.js
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   │   ├── admin/               # DashboardAdmin.jsx, Mesas.jsx, Caja.jsx,
│   │   │   │                        # DetalleMesa.jsx, Egresos.jsx, Historial.jsx,
│   │   │   │                        # Usuarios.jsx, Quejas.jsx, Stock.jsx,
│   │   │   │                        # CuentasPorPagar.jsx, Analitica.jsx,
│   │   │   │                        # DashboardFinanciero.jsx, SesionesActivas.jsx
│   │   │   ├── bar/                 # BarActivityChart.jsx, BarStock.jsx,
│   │   │   │                        # ModalCierreBar.jsx, SidebarBar.jsx
│   │   │   ├── kitchen/              # KitchenHeader.jsx, KitchenSidebar.jsx,
│   │   │   │                        # OrderCard.jsx, StockCocina.jsx
│   │   │   └── common/               # Paginacion.jsx
│   │   ├── context/                  # AuthContext.jsx, PedidoContext.jsx
│   │   ├── hooks/                    # usePaginacion.js, useTheme.js
│   │   ├── pages/                    # Admin.jsx, Login.jsx, Menu.jsx,
│   │   │                            # Bartender.jsx, BartenderDashboard.jsx,
│   │   │                            # KitchenDashboard.jsx, SuperAdminDashboard.jsx
│   │   ├── services/                 # apiService.js, authService.js, barService.js,
│   │   │                            # cajaService.js, dashboardFinancieroService.js,
│   │   │                            # egresosService.js, kitchenService.js,
│   │   │                            # menuService.js, pedidoService.js,
│   │   │                            # productoService.js, proveedorService.js,
│   │   │                            # quejaService.js, usuarioService.js,
│   │   │                            # zonaService.js, config.js
│   │   ├── App.jsx / App.css
│   │   └── main.jsx
│   ├── public/
│   ├── respaldo/
│   ├── .env.example
│   ├── .dockerignore
│   ├── Dockerfile
│   ├── eslint.config.js
│   ├── vite.config.js
│   ├── index.html
│   └── package.json
├── .gitignore
├── docker-compose.yml
├── package.json
└── README.md
```

## 🗄️ Modelo de datos

Base de datos relacional en MySQL, con más de 20 tablas, todas ligadas a `restaurante_id` para el aislamiento multi-tenant:

| Grupo | Tablas |
|---|---|
| Identidad y acceso | `usuarios`, `sesiones`, `restaurantes` |
| Mesas y zonas | `mesas`, `zonas`, `layout_mesas` |
| Pedidos y ventas | `pedidos`, `detalle_pedido`, `ventas`, `detalle_venta` |
| Caja | `caja`, `historial_caja`, `egresos` |
| Catálogo | `categorias`, `subcategorias`, `productos`, `opciones` |
| Proveedores | `proveedores`, `facturas_proveedor` |
| Soporte | `quejas` |
| Finanzas | `dashboardFinanciero`, `analitica` |

Relaciones y columnas transversales:
- `restaurante_id` en las tablas clave, para aislamiento entre restaurantes.
- `slug` único por restaurante, usado en la URL del menú QR.
- `token_publico` (columna heredada de `mesas`) — **eliminada** al migrar al esquema `slug + número de mesa`.

## 🚀 Puesta en marcha (desarrollo local)

### Requisitos
- Node.js 22
- Docker y Docker Compose
- MySQL (local vía XAMPP, o instancia en la nube)
- DBeaver (opcional, para administración visual de la base de datos)

### Clonar el repositorio

```bash
git clone https://github.com/stivenescobarg/MesaSmart_V.2.0.git
cd MesaSmart_V.2.0
```

### Backend

```bash
cd backend
cp .env.example .env      # completar las variables (ver sección siguiente)
npm install
npm run seed               # opcional: carga de datos semilla (seedMenu.js)
npm run dev                # levanta el backend con nodemon en :3001
```

### Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev                 # levanta Vite en :5173
```

### Con Docker Compose (backend + frontend)

```bash
docker compose up --build
```

Servicios expuestos:
- `mesasmart-backend` → `3001:3001`
- `mesasmart-frontend` → `5173:5173`

Para inspeccionar logs de un servicio:

```bash
docker compose logs -f backend
docker compose logs -f frontend
```

### Probar el menú QR en un celular (desarrollo)

En desarrollo, el frontend local puede exponerse con **ngrok** para escanear el QR desde un teléfono real:

```bash
ngrok http 5173
```

El backend permite automáticamente el origen de `*.ngrok-free.dev` / `*.ngrok-free.app` **solo cuando `NODE_ENV !== "production"`**; en producción esta regla no se evalúa.

## 🔑 Variables de entorno

**Backend (`backend/.env`)** — valores de referencia, ver `.env.example` para la lista completa:

```env
NODE_ENV=development
PORT=3001

# Base de datos (Azure Database for MySQL)
DB_HOST=
DB_PORT=3306
DB_USER=
DB_PASSWORD=
DB_NAME=mesasmart

# Autenticación
JWT_SECRET=

# Seguridad del QR
QR_SECRET=

# CORS
CORS_ORIGIN=https://mesasmart.app

# Cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

**Backend — pruebas (`backend/.env.test`)**

```env
TEST_SUPERADMIN_EMAIL=
TEST_SUPERADMIN_PASSWORD=
```

**Frontend (`frontend/.env`)**

```env
VITE_API_URL=http://localhost:3001
```

> Ninguno de estos secretos debe subirse al repositorio. `.env` está excluido vía `.gitignore`; solo `.env.example` se versiona.

## 🧪 Pruebas

El backend usa **Jest** con configuraciones separadas para pruebas unitarias e integración:

```bash
cd backend

# Unitarias
npx jest --config jest.unit.config.js --runInBand

# Integración
npx jest --config jest.integration.config.js

# Modo watch
npx jest --watch

# Cobertura
npx jest --coverage
```

Las pruebas de integración usan `tests/integration/globalSetup.js`, que genera `tests/integration/.test-context.json` con el contexto (tokens, IDs de prueba) que comparten las pruebas siguientes, apoyado en las credenciales de `TEST_SUPERADMIN_EMAIL` / `TEST_SUPERADMIN_PASSWORD` definidas en `.env.test`.

QA manual recomendado sobre flujos críticos: mesas, pedidos por QR, confirmación manual, caja/arqueo y división de cuentas.

## ☁️ Despliegue en producción

| Componente | Servicio Azure | Detalle |
|---|---|---|
| Backend | **Azure Container Apps** | Contenedor construido desde `backend/Dockerfile` (`node:22`), puerto `3001` |
| Frontend | **Azure Static Web Apps** | Build estático de Vite, servido en `mesasmart.app` |
| Base de datos | **Azure Database for MySQL — Servidor flexible** | Administrada con **DBeaver** |
| Dominio | `mesasmart.app` | Adquirido en Name.com, apuntado a Azure Static Web Apps |
| Recursos | GitHub Student Developer Pack + beneficios de Azure | Grupo de recursos `rg-mesasmart-prod` |

En producción no se usan túneles (ngrok se limita estrictamente a desarrollo); el acceso al backend y al frontend se resuelve directamente a través de los servicios de Azure.

## 💳 Planes comerciales

MesaSmart se ofrece como SaaS B2B con dos planes (valores en definición):

| Plan | Precio aproximado | Incluye |
|---|---|---|
| **Básico** | $99.000 – $149.000 COP / mes | Toma de pedidos, gestión de mesas, división de cuentas, gestión de productos y categorías, caja, control de ventas, dashboard básico, usuarios ilimitados |
| **Completo** | $179.000 – $229.000 COP / mes | Todo lo del plan Básico + funcionalidades avanzadas de administración, control y análisis |

> El detalle final del plan Completo y los precios definitivos están sujetos a ajuste antes del lanzamiento comercial.

## 🎨 Identidad visual

- Color principal: **naranja**, en un tono controlado (no saturado).
- Se evita el **verde** como color dominante de marca.
- Estilo buscado: moderno, limpio, profesional y tecnológico, pero reconociblemente ligado a restaurantes — evitando la estética de "aplicación genérica".
- Logo disponible como símbolo aislado (sin texto) en formato **SVG**.

## 📈 Estado actual y hoja de ruta

| Área | Estado |
|---|---|
| Frontend (React/Vite) | 🟢 Desplegado en Azure Static Web Apps |
| Backend (Node/Express) | 🟢 Desplegado en contenedor (Azure Container Apps) |
| Base de datos | 🟢 Migrada a Azure Database for MySQL (flexible) |
| Seguridad del QR (HMAC + confirmación manual) | 🟢 Implementada |
| Multi-tenant (`restaurante_id` + `tenantMiddleware`) |🟢 Implementado  |
| JWT y roles | 🟢 Implementado |
| Menú QR con slug | 🟢 Implementado |
| `token_publico` | 🔴 Eliminado del esquema |
| Cloudinary (imágenes del menú) | 🟢 Implementado |
| Cocina / Barra | 🟢 Implementado (barra en integración continua) |
| Caja / Arqueo | 🟢 Implementado, mejoras visuales en curso |
| División de cuentas, descuentos, servicio | 🟢 Implementado |
| Proveedores / Finanzas / Auditoría |🟢 Implementado  |
| Super Admin / Planes SaaS | 🟢 Implementado |
| Landing page | 🟢 Implementado  |
| Logo / identidad SVG | 🟢 Implementado  |
| Swagger | 🟡 Desactualizado (no prioritario) |


**Pendiente conocido (bajo riesgo):** extender la protección anti-IDOR aplicada al QR de mesa hacia `quejaController.js` / `quejaRoutes.js`.

## 📄 Licencia

Proyecto académico desarrollado para la formación **SENA — ADSO** (ficha 3144585, regional Antioquia). Uso y distribución sujetos a lo que defina el equipo del proyecto.

---

<div align="center">

**MesaSmart** — una mesa, todo conectado.

Desarrollado por Stiven Escobar Gómez, Sara García y Kerry Herrera.

</div>