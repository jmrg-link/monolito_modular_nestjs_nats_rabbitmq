# Productos API

[Volver al README](../README.md) | [Autenticación API](./auth-api.md) | [Usuarios API](./users-api.md) | [Ordenes API](./orders-api.md)

La API de productos proporciona endpoints para la gestión completa de productos, incluyendo operaciones CRUD y eventos de mensajería.

## Flujo de Productos

```mermaid
sequenceDiagram
    participant Cliente
    participant Gateway as API Gateway
    participant Guard as JWT & Role Guards
    participant Product as Product Service
    participant MongoDB
    participant NATS
    participant RMQ as RabbitMQ

    %% Listar productos
    Cliente->>Gateway: GET /products
    Gateway->>Product: Listar productos
    Product->>MongoDB: Buscar productos
    MongoDB-->>Product: Lista de productos
    Product-->>Gateway: Productos
    Gateway-->>Cliente: Productos

    %% Obtener producto por ID
    Cliente->>Gateway: GET /products/:id
    Gateway->>Product: Buscar por ID
    Product->>MongoDB: Buscar documento
    MongoDB-->>Product: Producto encontrado
    Product-->>Gateway: Datos de producto
    Gateway-->>Cliente: Datos de producto

    %% Crear producto (autenticado)
    Cliente->>Gateway: POST /products
    Gateway->>Guard: Verificar JWT + Roles
    Guard-->>Gateway: Autorizado
    Gateway->>Product: Crear producto
    Product->>MongoDB: Guardar producto
    MongoDB-->>Product: Producto guardado
    Product->>NATS: Publicar evento product.created
    Product->>RMQ: Publicar evento product.created
    Product-->>Gateway: Producto creado
    Gateway-->>Cliente: Producto creado

    %% Actualizar producto (autenticado)
    Cliente->>Gateway: PUT /products/:id
    Gateway->>Guard: Verificar JWT + Roles
    Guard-->>Gateway: Autorizado
    Gateway->>Product: Actualizar producto
    Product->>MongoDB: Actualizar documento
    MongoDB-->>Product: Producto actualizado
    Product->>NATS: Publicar evento product.updated
    Product->>RMQ: Publicar evento product.updated
    Product-->>Gateway: Producto actualizado
    Gateway-->>Cliente: Producto actualizado

    %% Eliminar producto (autenticado)
    Cliente->>Gateway: DELETE /products/:id
    Gateway->>Guard: Verificar JWT + Roles
    Guard-->>Gateway: Autorizado
    Gateway->>Product: Eliminar producto
    Product->>MongoDB: Eliminar documento
    MongoDB-->>Product: Producto eliminado
    Product->>NATS: Publicar evento product.deleted
    Product->>RMQ: Publicar evento product.deleted
    Product-->>Gateway: Confirmación
    Gateway-->>Cliente: Confirmación
```

## Endpoints

### `GET /products`

Lista todos los productos. No requiere autenticación.

**Query Parameters:**

- `page` (default: 1): Número de página
- `limit` (default: 10): Cantidad de elementos por página
- `sortBy` (opcional): Campo para ordenar
- `sortDirection` (opcional): Dirección de ordenamiento (asc, desc)

**Response:**

```json
{
  "items": [
    {
      "id": "60d21b4667d0d8992e610d85",
      "name": "Producto 1",
      "price": 19.99,
      "isActive": true,
      "description": "Descripción del producto 1"
    },
    {
      "id": "60d21b4667d0d8992e610d86",
      "name": "Producto 2",
      "price": 29.99,
      "isActive": true,
      "description": "Descripción del producto 2"
    }
  ],
  "meta": {
    "totalItems": 25,
    "itemsPerPage": 10,
    "totalPages": 3,
    "currentPage": 1,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

### `GET /products/:id`

Obtiene un producto por su ID. No requiere autenticación.

**Response:**

```json
{
  "id": "60d21b4667d0d8992e610d85",
  "name": "Producto 1",
  "price": 19.99,
  "isActive": true,
  "description": "Descripción del producto 1"
}
```

### `POST /products`

Crea un nuevo producto. Requiere autenticación y rol adecuado.

**Headers:**

```text
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Request:**

```json
{
  "name": "Nuevo Producto",
  "price": 49.99,
  "description": "Descripción del nuevo producto"
}
```

**Response:**

```json
{
  "id": "60d21b4667d0d8992e610d87",
  "name": "Nuevo Producto",
  "price": 49.99,
  "isActive": true,
  "description": "Descripción del nuevo producto"
}
```

### `PUT /products/:id`

Actualiza un producto existente. Requiere autenticación y rol adecuado.

**Headers:**

```json
{
  "name": "Producto Actualizado",
  "price": 59.99,
  "description": "Descripción actualizada"
}
```

**Response:**

```json
{
  "id": "60d21b4667d0d8992e610d85",
  "name": "Producto Actualizado",
  "price": 59.99,
  "isActive": true,
  "description": "Descripción actualizada"
}
```

### `DELETE /products/:id`

Elimina un producto. Requiere autenticación y rol adecuado.

**Headers:**

```text
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response:**

```json
{
  "id": "60d21b4667d0d8992e610d85",
  "deleted": true
}
```

## Eventos de Mensajería

El servicio de productos emite los siguientes eventos cuando se producen cambios:

### NATS y RabbitMQ

| Evento            | Descripción                      | Datos                           |
| ----------------- | -------------------------------- | ------------------------------- |
| `product.created` | Cuando se crea un nuevo producto | `{ id, name, price, isActive }` |
| `product.updated` | Cuando se actualiza un producto  | `{ id, ...camposActualizados }` |
| `product.deleted` | Cuando se elimina un producto    | `{ id }`                        |

Estos eventos pueden ser consumidos por otros servicios para reaccionar a cambios en los productos (por ejemplo, para actualizar un catálogo, notificar a los clientes, etc.)
