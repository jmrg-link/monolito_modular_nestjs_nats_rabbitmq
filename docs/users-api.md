# Usuarios API

[Volver al README](../README.md) | [Autenticación API](./auth-api.md) | [Productos API](./products-api.md) | [Ordenes API](./orders-api.md)

La API de usuarios proporciona endpoints para la gestión de usuarios, incluyendo operaciones CRUD completas con control de acceso basado en roles.

## Flujo de Usuarios

```mermaid
sequenceDiagram
    participant Cliente
    participant Gateway as API Gateway
    participant Guard as JWT & Role Guards
    participant User as User Service
    participant MongoDB
    participant NATS
    participant RMQ as RabbitMQ

    %% Listar usuarios (paginado)
    Cliente->>Gateway: GET /users?page=1&limit=10
    Gateway->>Guard: Verificar JWT + Roles
    Guard-->>Gateway: Autorizado (admin)
    Gateway->>User: Listar usuarios paginados
    User->>MongoDB: Consulta paginada
    MongoDB-->>User: Resultados + total
    User-->>Gateway: Datos paginados
    Gateway-->>Cliente: Respuesta paginada

    %% Obtener usuario por ID
    Cliente->>Gateway: GET /users/:id
    Gateway->>Guard: Verificar JWT + Roles
    Guard-->>Gateway: Autorizado (admin)
    Gateway->>User: Buscar por ID
    User->>MongoDB: Buscar documento
    MongoDB-->>User: Usuario encontrado
    User-->>Gateway: Datos de usuario
    Gateway-->>Cliente: Datos de usuario

    %% Crear usuario
    Cliente->>Gateway: POST /users
    Gateway->>Guard: Verificar JWT + Roles
    Guard-->>Gateway: Autorizado (admin)
    Gateway->>User: Crear usuario
    User->>User: Verificar email único
    User->>MongoDB: Buscar email
    MongoDB-->>User: Email no existe
    User->>MongoDB: Guardar usuario
    MongoDB-->>User: Usuario guardado
    User->>NATS: Publicar evento user.created
    User->>RMQ: Publicar evento user.created
    User-->>Gateway: Usuario creado
    Gateway-->>Cliente: Usuario creado

    %% Actualizar usuario
    Cliente->>Gateway: PUT /users/:id
    Gateway->>Guard: Verificar JWT + Roles
    Guard-->>Gateway: Autorizado (admin)
    Gateway->>User: Actualizar usuario
    User->>MongoDB: Actualizar documento
    MongoDB-->>User: Usuario actualizado
    User->>NATS: Publicar evento user.updated
    User->>RMQ: Publicar evento user.updated
    User-->>Gateway: Usuario actualizado
    Gateway-->>Cliente: Usuario actualizado

    %% Eliminar usuario
    Cliente->>Gateway: DELETE /users/:id
    Gateway->>Guard: Verificar JWT + Roles
    Guard-->>Gateway: Autorizado (admin)
    Gateway->>User: Eliminar usuario
    User->>MongoDB: Eliminar documento
    MongoDB-->>User: Usuario eliminado
    User->>NATS: Publicar evento user.deleted
    User->>RMQ: Publicar evento user.deleted
    User-->>Gateway: Confirmación
    Gateway-->>Cliente: Confirmación

    %% Activar/Desactivar usuario
    Cliente->>Gateway: PUT /users/:id/activate
    Gateway->>Guard: Verificar JWT + Roles
    Guard-->>Gateway: Autorizado (admin)
    Gateway->>User: Activar usuario
    User->>MongoDB: Actualizar isActive=true
    MongoDB-->>User: Usuario actualizado
    User->>NATS: Publicar evento user.activated
    User->>RMQ: Publicar evento user.activated
    User-->>Gateway: Confirmación
    Gateway-->>Cliente: Confirmación
```

## Endpoints

### `GET /users`

Lista los usuarios con paginación. Requiere rol de administrador.

**Headers:**

```text
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

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
      "id": "60d21b4667d0d8992e610c85",
      "email": "usuario1@ejemplo.com",
      "name": "Usuario Uno",
      "roles": ["user"],
      "isActive": true
    },
    {
      "id": "60d21b4667d0d8992e610c86",
      "email": "usuario2@ejemplo.com",
      "name": "Usuario Dos",
      "roles": ["admin", "user"],
      "isActive": true
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

### `GET /users/:id`

Obtiene un usuario por su ID. Requiere rol de administrador.

**Headers:**

```text
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response:**

```json
{
  "id": "60d21b4667d0d8992e610c85",
  "email": "usuario@ejemplo.com",
  "name": "Nombre Usuario",
  "roles": ["user"],
  "isActive": true
}
```

### `POST /users`

Crea un nuevo usuario. Requiere rol de administrador.

**Headers:**

```text
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Request:**

```json
{
  "email": "nuevo@ejemplo.com",
  "name": "Nuevo Usuario",
  "password": "contraseña123",
  "roles": ["user"]
}
```

**Response:**

```json
{
  "id": "60d21b4667d0d8992e610c87",
  "email": "nuevo@ejemplo.com",
  "name": "Nuevo Usuario",
  "roles": ["user"],
  "isActive": true
}
```

### `PUT /users/:id`

Actualiza un usuario existente. Requiere rol de administrador.

**Headers:**

```text
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Request:**

```json
{
  "name": "Nombre Actualizado",
  "email": "actualizado@ejemplo.com",
  "roles": ["user", "editor"]
}
```

**Response:**

```json
{
  "id": "60d21b4667d0d8992e610c85",
  "email": "actualizado@ejemplo.com",
  "name": "Nombre Actualizado",
  "roles": ["user", "editor"],
  "isActive": true
}
```

### `DELETE /users/:id`

Elimina un usuario. Requiere rol de administrador.

**Headers:**

```text
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response:**

```json
{
  "id": "60d21b4667d0d8992e610c85",
  "deleted": true
}
```

### `PUT /users/:id/activate`

Activa un usuario desactivado. Requiere rol de administrador.

**Headers:**

```text
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response:**

```json
{
  "id": "60d21b4667d0d8992e610c85",
  "email": "usuario@ejemplo.com",
  "name": "Nombre Usuario",
  "roles": ["user"],
  "isActive": true
}
```

### `PUT /users/:id/deactivate`

Desactiva un usuario activo. Requiere rol de administrador.

**Headers:**

```text
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response:**

```json
{
  "id": "60d21b4667d0d8992e610c85",
  "email": "usuario@ejemplo.com",
  "name": "Nombre Usuario",
  "roles": ["user"],
  "isActive": false
}
```
