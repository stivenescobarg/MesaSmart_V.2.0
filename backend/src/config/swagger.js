const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'MesaSmart API',
      version: '1.0.0',
      description: 'API del sistema de gestión de restaurante MesaSmart',
      contact: {
        name: 'Soporte MesaSmart',
        email: 'soporte@mesasmart.com',
      },
    },
    servers: [
      {
        url: process.env.SWAGGER_SERVER || 'http://localhost:3001',
        description: 'Servidor de desarrollo',
      },
    ],
    // ─── Orden de secciones en Swagger UI ───
    'x-tagGroups': [
      { name: '🔐 Autenticación', tags: ['Autenticación'] },
      { name: '👥 Usuarios', tags: ['Usuarios'] },
      { name: '🪑 Mesas', tags: ['Mesas'] },
      { name: '📦 Pedidos Admin', tags: ['Pedidos'] },
      { name: '🍳 Cocina', tags: ['Cocina'] },
      { name: '📋 Stock', tags: ['Stock'] },
      { name: '💵 Caja', tags: ['Caja'] },
      { name: '💸 Egresos', tags: ['Egresos'] },
      { name: '📊 Métricas', tags: ['Métricas'] },
      { name: '🗂️ Zonas', tags: ['Zonas'] },
      { name: '🔑 Sesiones', tags: ['Sesiones'] },
      { name: '📝 Quejas', tags: ['Quejas'] },
      { name: '📖 Menú', tags: ['Menú'] },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Usuario: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            nombre: { type: 'string' },
            email: { type: 'string', format: 'email' },
            rol: { type: 'string', enum: ['admin', 'cocinero', 'bartender', 'mesero'] },
          },
        },
        Stock: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            nombre: { type: 'string' },
            categoria: { type: 'string' },
            cantidad: { type: 'integer' },
            precio: { type: 'number' },
            imagen: { type: 'string' },
            bajoStock: { type: 'boolean' },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' },
          },
        },
        Egreso: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            descripcion: { type: 'string' },
            monto: { type: 'number' },
            categoria: { type: 'string' },
            fecha: { type: 'string', format: 'date-time' },
            cajaId: { type: 'integer' },
          },
        },
        Mesa: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            numero: { type: 'integer' },
            zona: { type: 'string' },
            estado: { type: 'string', enum: ['libre', 'ocupada', 'reservada'] },
            posicionX: { type: 'number' },
            posicionY: { type: 'number' },
            capacidad: { type: 'integer' },
          },
        },
        MetricaResumen: {
          type: 'object',
          properties: {
            totalVentas: { type: 'number' },
            totalPedidos: { type: 'integer' },
            promedioTicket: { type: 'number' },
          },
        },
        Pedido: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            mesa: { type: 'string' },
            estado: { type: 'string', enum: ['pendiente', 'en_preparacion', 'listo'] },
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'integer' },
                  nombre: { type: 'string' },
                  cantidad: { type: 'integer' },
                  observacion: { type: 'string' },
                  imagen: { type: 'string' },
                },
              },
            },
            hora: { type: 'string', format: 'date-time' },
            notas: { type: 'string' },
            total: { type: 'number' },
          },
        },
        PedidoCocina: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            mesa: { type: 'string' },
            estado: { type: 'string', enum: ['pendiente', 'en_preparacion', 'listo'] },
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  nombre: { type: 'string' },
                  cantidad: { type: 'integer' },
                  precio: { type: 'number' },
                  categoria: { type: 'string' },
                  observacion: { type: 'string' },
                  imagen: { type: 'string', nullable: true },
                },
              },
            },
            hora: { type: 'string', format: 'date-time' },
            notas: { type: 'string' },
          },
        },
        ItemPedido: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            nombre: { type: 'string' },
            cantidad: { type: 'integer' },
            observacion: { type: 'string' },
            precio: { type: 'number' },
          },
        },
        Zona: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            nombre: { type: 'string' },
            descripcion: { type: 'string' },
          },
        },
        Sesion: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            usuarioId: { type: 'integer' },
            token: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            expiresAt: { type: 'string', format: 'date-time' },
          },
        },
        Queja: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            descripcion: { type: 'string' },
            estado: { type: 'string', enum: ['pendiente', 'en_proceso', 'resuelta'] },
            fecha: { type: 'string', format: 'date-time' },
            usuarioId: { type: 'integer' },
            mesa: { type: 'string' },
          },
        },
        Producto: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            nombre: { type: 'string' },
            descripcion: { type: 'string' },
            precio: { type: 'number' },
            imagen: { type: 'string' },
            tiene_termino: { type: 'boolean' },
            categoria: { type: 'string' },
            subcategoria: { type: 'string' },
            opciones: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  nombre: { type: 'string' },
                  precio: { type: 'number' },
                },
              },
            },
            adiciones: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  nombre: { type: 'string' },
                  precio: { type: 'number' },
                },
              },
            },
          },
        },
        Categoria: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            nombre: { type: 'string' },
          },
        },
        MovimientoStock: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            productoId: { type: 'integer' },
            cantidad: { type: 'integer' },
            tipo: { type: 'string', enum: ['entrada', 'salida'] },
            fecha: { type: 'string', format: 'date-time' },
            usuario: { type: 'string' },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: [
    './src/routes/*.js',
    './src/routes/admin/*.js',
    './src/controllers/*.js',
    './src/controllers/admin/*.js',
  ],
};

module.exports = swaggerJsdoc(options);