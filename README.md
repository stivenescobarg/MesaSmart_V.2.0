# 🍽️ MesaSmart

Sistema web integral para la gestión de restaurantes que permite a los clientes realizar pedidos directamente desde su mesa, optimizando la comunicación entre clientes, cocina y administración mediante una plataforma moderna desarrollada con React, Node.js y MySQL.

---

## 📖 Descripción General

MesaSmart es una solución tecnológica diseñada para digitalizar y automatizar el flujo de pedidos dentro de un restaurante.

El sistema elimina la necesidad de tomar pedidos manualmente, permitiendo que los clientes interactúen directamente con el menú digital, mientras que la cocina y el personal administrativo reciben y gestionan la información en tiempo real.

La plataforma busca reducir errores operativos, mejorar los tiempos de atención y proporcionar herramientas administrativas para la toma de decisiones mediante reportes y estadísticas.

---

## 🎯 Objetivos del Proyecto

* Digitalizar el proceso de pedidos en restaurantes.
* Mejorar la experiencia del cliente.
* Reducir errores de comunicación entre clientes y cocina.
* Optimizar la gestión administrativa.
* Centralizar la información operativa del negocio.
* Facilitar el control de inventario y productos.
* Proporcionar métricas para la toma de decisiones.

---

# ✨ Características Principales

## 👤 Módulo Cliente

* Consulta de menú digital.
* Visualización de categorías y productos.
* Realización de pedidos desde la mesa.
* Seguimiento del estado del pedido.
* Interfaz intuitiva y responsive.

---

## 👨‍🍳 Módulo Cocina

* Recepción de pedidos en tiempo real.
* Visualización de órdenes pendientes.
* Actualización de estados de preparación.
* Organización eficiente del flujo de trabajo.

---

## 👨‍💼 Módulo Administrativo

* Gestión de productos.
* Gestión de categorías.
* Gestión de inventario.
* Gestión de pedidos.
* Administración de usuarios.
* Dashboard de estadísticas.
* Generación de reportes.
* Control de operaciones sensibles mediante PIN.

---

## 🔐 Seguridad

* Autenticación mediante JWT (JSON Web Token).
* Contraseñas cifradas con bcryptjs.
* Protección de rutas privadas.
* Control de acceso según rol.
* Validación de operaciones críticas mediante PIN.

---

# 🏗️ Arquitectura del Sistema

```text
MesaSmart
│
├── backend
│   ├── src
│   │   ├── config
│   │   ├── controllers
│   │   │   └── admin
│   │   ├── middlewares
│   │   ├── models
│   │   ├── routes
│   │   │   └── admin
│   │   └── utils
│
├── database
│
├── documents
│
└── frontend
    ├── public
    └── src
        ├── assets
        │   └── images
        ├── components
        │   ├── admin
        │   └── kitchen
        ├── context
        ├── data
        ├── hooks
        ├── pages
        ├── services
        └── utils
```

---

# 🛠️ Tecnologías Utilizadas

## Frontend

| Tecnología       | Uso                             |
| ---------------- | ------------------------------- |
| React 19         | Construcción de interfaces      |
| Vite             | Bundler y entorno de desarrollo |
| React Router DOM | Navegación SPA                  |
| Axios            | Comunicación con API            |
| Recharts         | Visualización de estadísticas   |

---

## Backend

| Tecnología | Uso                        |
| ---------- | -------------------------- |
| Node.js    | Entorno de ejecución       |
| Express 5  | Framework del servidor     |
| JWT        | Autenticación              |
| bcryptjs   | Cifrado de contraseñas     |
| MySQL2     | Conexión a base de datos   |
| PDFKit     | Generación de reportes PDF |
| UUID       | Identificadores únicos     |

---

## Base de Datos

* MySQL / dbaver -- aiven

---

# 📂 Estructura de Capas

## Controllers

Contienen la lógica que procesa las solicitudes HTTP y coordina la comunicación entre rutas, modelos y servicios.

## Routes

Definen los endpoints disponibles para el frontend y otros consumidores de la API.

## Models

Gestionan la interacción con la base de datos.

## Middlewares

Ejecutan validaciones y controles de acceso antes de llegar a los controladores.

## Utils

Funciones reutilizables y utilidades generales del sistema.

---

# ⚙️ Variables de Entorno

Crear un archivo `.env` dentro de la carpeta `backend`.

```env
PORT=3001

DB_HOST=
DB_PORT=
DB_USER=
DB_PASSWORD=
DB_NAME=

JWT_SECRET=

STOCK_PIN=
PIN_ELIMINAR=
```

---

# 🚀 Instalación Local

## 1. Clonar el repositorio

```bash
git clone https://github.com/stivenescobarg/MesaSmart_V.2.0.git
```

```bash
cd MesaSmart
```

---

## 2. Instalar dependencias Backend

```bash
cd backend
npm install
```

---

## 3. Instalar dependencias Frontend

```bash
cd ../frontend
npm install
```

---

## 4. Configurar variables de entorno

Crear el archivo:

```bash
backend/.env
```

y completar las variables necesarias.

---

## 5. Ejecutar Backend

```bash
cd backend
npm run dev
```

Servidor:

```text
http://localhost:3001
```

---

## 6. Ejecutar Frontend

```bash
cd frontend
npm run dev
```

Aplicación:

```text
http://localhost:5173
```

---

# 📜 Scripts Disponibles

## Backend

```bash
npm start
```

Ejecuta el servidor en producción.

```bash
npm run dev
```

Ejecuta el servidor con Nodemon.

```bash
npm run seed
```

Carga datos iniciales en la base de datos.

---

## Frontend

```bash
npm run dev
```

Inicia el entorno de desarrollo.

```bash
npm run build
```

Genera la versión de producción.

```bash
npm run preview
```

Previsualiza la versión compilada.

```bash
npm run lint
```

Analiza la calidad del código.

---

# 🔄 Flujo General del Sistema

1. El cliente accede al menú digital.
2. Selecciona productos.
3. Genera un pedido.
4. El backend registra la orden.
5. La cocina recibe el pedido en tiempo real.
6. La cocina actualiza el estado.
7. El administrador puede monitorear pedidos y estadísticas.
8. El sistema almacena toda la información en MySQL.

---

# 📈 Funcionalidades Administrativas

* Gestión de productos.
* Gestión de inventario.
* Control de stock.
* Reportes PDF.
* Dashboard de ventas.
* Seguimiento de pedidos.
* Gestión de usuarios.

---

# 🔮 Mejoras Futuras

* Integración con pagos en línea.
* Notificaciones en tiempo real mediante WebSockets.
* Integración con códigos QR.
* Aplicación móvil.
* Sistema de reservas.
* Analítica avanzada de ventas.
* Multi-sucursal.

---

# 👨‍💻 Autores

**Stiven Escobar Gómez**
**Sara Garcia Urrego**
**Kerry Herrera**

Aprendices ADSO - SENA

Proyecto desarrollado como solución tecnológica para la digitalización y optimización de procesos en restaurantes.

---

# 📄 Licencia

Este proyecto se distribuye únicamente con fines académicos y educativos.
