# Órdenes API

[Volver al README](../README.md) | [Autenticación API](./auth-api.md) | [Usuarios API](./users-api.md) | [Productos API](./products-api.md)

La API de órdenes proporciona endpoints para la gestión completa de pedidos, con integración de usuarios, productos y mensajería para eventos de estado.

## Flujo de Órdenes

```mermaid
sequenceDiagram
    participant Cliente
    participant Gateway as API Gateway
    participant Guard as JWT Guard
    participant Order as Order Service
    participant Product as Product Service
    participant User as User Service
    participant MongoDB
    participant NATS
    participant RMQ as RabbitMQ

    %% Listar órdenes del usuario
    Cliente->>Gateway: GET /orders
    Gateway->>Guard: Verificar JWT
    Guard-->>Gateway: Usuario autenticado
    Gateway->>Order: Listar órdenes del usuario
    Order->>MongoDB: Buscar órdenes
    MongoDB-->>Order: Lista de órdenes
    Order-->>Gateway: Órdenes
    Gateway-->>Cliente: Órdenes

    %% Obtener orden por ID
    Cliente->>Gateway: GET /orders/:id
    Gateway->>Guard: Verificar JWT
    Guard-->>Gateway: Usuario autenticado
    Gateway->>Order: Buscar por ID
    Order->>MongoDB: Buscar documento
    MongoDB-->>Order: Orden encontrada
    Order-->>Gateway: Datos de orden
    Gateway-->>Cliente: Datos de orden

    %% Crear orden
    Cliente->>Gateway: POST /orders
    Gateway->>Guard: Verificar JWT
    Guard-->>Gateway: Usuario autenticado
    Gateway->>Order: Crear orden
    Order->>Product: Verificar productos
    Product->>MongoDB: Buscar productos
    MongoDB-->>Product: Productos encontrados
    Product-->>Order: Productos válidos
    Order->>User: Verificar usuario
    User->>MongoDB: Buscar usuario
    MongoDB-->>User: Usuario encontrado
    User-->>Order: Usuario válido
    Order->>Order: Calcular totales
    Order->>MongoDB: Guardar orden
    MongoDB-->>Order: Orden guardada
    Order->>NATS: Publicar evento order.created
    Order->>RMQ: Publicar evento order.created
    Order-->>Gateway: Orden creada
    Gateway-->>Cliente: Orden creada

    %% Actualizar estado de orden
    Cliente->>Gateway: PUT /orders/:id/status
    Gateway->>Guard: Verificar JWT + Roles
    Guard-->>Gateway: Autorizado (admin)
    Gateway->>Order: Actualizar estado
    Order->>MongoDB: Actualizar documento
    MongoDB-->>Order: Orden actualizada
    Order->>NATS: Publicar evento order.statusChanged
    Order->>RMQ: Publicar evento order.statusChanged
    Order-->>Gateway: Orden actualizada
    Gateway-->>Cliente: Orden actualizada

    %% Cancelar orden
    Cliente->>Gateway: PUT /orders/:id/cancel
    Gateway->>Guard: Verificar JWT
    Guard-->>Gateway: Usuario autenticado
    Gateway->>Order: Cancelar orden
    Order->>Order: Verificar permiso
    Order->>MongoDB: Actualizar estado
    MongoDB-->>Order: Orden actualizada
    Order->>NATS: Publicar evento order.cancelled
    Order->>RMQ: Publicar evento order.cancelled
    Order-->>Gateway: Confirmación
    Gateway-->>Cliente: Confirmación
```

## Endpoints

### `GET /orders`

Lista las órdenes del usuario autenticado.

**Headers:**

```text
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Query Parameters:**

- `page` (default: 1): Número de página
- `limit` (default: 10): Cantidad de elementos por página
- `status` (opcional): Filtrar por estado
- `sortBy` (opcional): Campo para ordenar
- `sortDirection` (opcional): Dirección de ordenamiento (asc, desc)

**Response:**

```json
{
  "items": [
    {
      "id": "60d21b4667d0d8992e610e85",
      "userId": "60d21b4667d0d8992e610c85",
      "items": [
        {
          "productId": "60d21b4667d0d8992e610d85",
          "name": "Producto 1",
          "price": 19.99,
          "quantity": 2,
          "subtotal": 39.98
        }
      ],
      "total": 39.98,
      "status": "pending",
      "createdAt": "2025-04-19T14:30:00.000Z",
      "updatedAt": "2025-04-19T14:30:00.000Z"
    }
  ],
  "meta": {
    "totalItems": 5,
    "itemsPerPage": 10,
    "totalPages": 1,
    "currentPage": 1,
    "hasNextPage": false,
    "hasPreviousPage": false
  }
}
```

### `GET /orders/:id`

Obtiene una orden por su ID. El usuario debe ser propietario o administrador.

**Headers:**

```text
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response:**

```json
{
  "id": "60d21b4667d0d8992e610e85",
  "userId": "60d21b4667d0d8992e610c85",
  "items": [
    {
      "productId": "60d21b4667d0d8992e610d85",
      "name": "Producto 1",
      "price": 19.99,
      "quantity": 2,
      "subtotal": 39.98
    }
  ],
  "total": 39.98,
  "status": "pending",
  "createdAt": "2025-04-19T14:30:00.000Z",
  "updatedAt": "2025-04-19T14:30:00.000Z"
}
```

### `POST /orders`

Crea una nueva orden. Requiere autenticación.

**Headers:**

```text
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Request:**

```json
{
  "items": [
    {
      "productId": "60d21b4667d0d8992e610d85",
      "quantity": 2
    },
    {
      "productId": "60d21b4667d0d8992e610d86",
      "quantity": 1
    }
  ]
}
```

**Response:**

```json
{
  "id": "60d21b4667d0d8992e610e86",
  "userId": "60d21b4667d0d8992e610c85",
  "items": [
    {
      "productId": "60d21b4667d0d8992e610d85",
      "name": "Producto 1",
      "price": 19.99,
      "quantity": 2,
      "subtotal": 39.98
    },
    {
      "productId": "60d21b4667d0d8992e610d86",
      "name": "Producto 2",
      "price": 29.99,
      "quantity": 1,
      "subtotal": 29.99
    }
  ],
  "total": 69.97,
  "status": "pending",
  "createdAt": "2025-04-19T14:35:00.000Z",
  "updatedAt": "2025-04-19T14:35:00.000Z"
}
```

### `PUT /orders/:id/status`

Actualiza el estado de una orden. Requiere rol de administrador.

**Headers:**

```text
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Request:**

```json
{
  "status": "processing"
}
```

**Response:**

```json
{
  "id": "60d21b4667d0d8992e610e85",
  "status": "processing",
  "updatedAt": "2025-04-19T14:40:00.000Z"
}
```

### `PUT /orders/:id/cancel`

Cancela una orden. El usuario debe ser propietario o administrador.

**Headers:**

```text
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response:**

```json
{
  "id": "60d21b4667d0d8992e610e85",
  "status": "cancelled",
  "updatedAt": "2025-04-19T14:45:00.000Z"
}
```

## Estados de las Órdenes

Una orden puede pasar por los siguientes estados:

1. `pending` - Orden creada pero no procesada
2. `processing` - Orden en proceso de preparación
3. `shipped` - Orden enviada
4. `delivered` - Orden entregada
5. `cancelled` - Orden cancelada

## Eventos de Mensajería

El servicio de órdenes emite los siguientes eventos cuando se producen cambios:

### NATS y RabbitMQ

| Evento                | Descripción                             | Datos                                           |
| --------------------- | --------------------------------------- | ----------------------------------------------- |
| `order.created`       | Cuando se crea una nueva orden          | `{ id, userId, total, items, status }`          |
| `order.statusChanged` | Cuando cambia el estado de una orden    | `{ id, oldStatus, newStatus, updatedAt }`       |
| `order.cancelled`     | Cuando se cancela una orden             | `{ id, userId, cancelledAt }`                   |
| `order.paid`          | Cuando se registra el pago de una orden | `{ id, userId, amount, paymentMethod, paidAt }` |

Estos eventos pueden ser consumidos por otros servicios para reaccionar a cambios en las órdenes (por ejemplo, para notificar a los usuarios, actualizar inventario, etc.)
