# Autenticación API

[Volver al README](../README.md) | [Usuarios API](./users-api.md) | [Productos API](./products-api.md) | [Ordenes API](./orders-api.md)

La API de autenticación proporciona endpoints para registro, login, gestión de perfiles y tokens JWT.

## Flujo de Autenticación

```mermaid
sequenceDiagram
    participant Cliente
    participant Gateway as API Gateway
    participant Auth as Servicio Auth
    participant User as User Service
    participant MongoDB

    %% Registro de usuario
    Cliente->>Gateway: POST /auth/register
    Gateway->>Auth: Registrar usuario
    Auth->>User: Verificar si email existe
    User->>MongoDB: Buscar email
    MongoDB-->>User: No existe
    Auth->>Auth: Generar hash de contraseña
    Auth->>User: Crear usuario
    User->>MongoDB: Guardar usuario
    MongoDB-->>User: Usuario guardado
    User-->>Auth: Usuario creado
    Auth->>Auth: Generar tokens JWT
    Auth-->>Gateway: Tokens + datos usuario
    Gateway-->>Cliente: Tokens + datos usuario

    %% Login de usuario
    Cliente->>Gateway: POST /auth/login
    Gateway->>Auth: Validar credenciales
    Auth->>User: Verificar usuario
    User->>MongoDB: Buscar por email
    MongoDB-->>User: Usuario encontrado
    User-->>Auth: Datos de usuario
    Auth->>Auth: Verificar contraseña
    Auth->>Auth: Generar tokens JWT
    Auth-->>Gateway: Tokens + datos usuario
    Gateway-->>Cliente: Tokens + datos usuario

    %% Refrescar Token
    Cliente->>Gateway: POST /auth/refresh-token
    Gateway->>Auth: Validar refresh token
    Auth->>Auth: Verificar firma y expiración
    Auth->>User: Verificar usuario existente
    User->>MongoDB: Buscar por ID
    MongoDB-->>User: Usuario encontrado
    User-->>Auth: Datos de usuario
    Auth->>Auth: Generar nuevo access token
    Auth-->>Gateway: Nuevo access token
    Gateway-->>Cliente: Nuevo access token

    %% Perfil de usuario
    Cliente->>Gateway: GET /auth/profile (con JWT)
    Gateway->>Gateway: Validar JWT
    Gateway->>Auth: Obtener perfil
    Auth-->>Gateway: Datos de perfil
    Gateway-->>Cliente: Datos de perfil

    %% Cambio de contraseña
    Cliente->>Gateway: POST /auth/change-password (con JWT)
    Gateway->>Gateway: Validar JWT
    Gateway->>Auth: Cambiar contraseña
    Auth->>User: Buscar usuario
    User->>MongoDB: Buscar por ID
    MongoDB-->>User: Usuario encontrado
    User-->>Auth: Datos de usuario
    Auth->>Auth: Verificar contraseña actual
    Auth->>Auth: Generar hash de nueva contraseña
    Auth->>User: Actualizar contraseña
    User->>MongoDB: Actualizar usuario
    MongoDB-->>User: Usuario actualizado
    User-->>Auth: Actualización exitosa
    Auth-->>Gateway: Confirmación
    Gateway-->>Cliente: Confirmación
```

## Endpoints

### `POST /auth/register`

Registra un nuevo usuario en el sistema.

**Request:**

```json
{
  "email": "usuario@ejemplo.com",
  "name": "Nombre Usuario",
  "password": "contraseña123"
}
```

**Response:**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 3600,
  "user": {
    "id": "60d21b4667d0d8992e610c85",
    "email": "usuario@ejemplo.com",
    "name": "Nombre Usuario",
    "roles": ["user"]
  }
}
```

### `POST /auth/login`

Inicia sesión con credenciales existentes.

**Request:**

```json
{
  "email": "usuario@ejemplo.com",
  "password": "contraseña123"
}
```

**Response:**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 3600,
  "user": {
    "id": "60d21b4667d0d8992e610c85",
    "email": "usuario@ejemplo.com",
    "name": "Nombre Usuario",
    "roles": ["user"]
  }
}
```

### `POST /auth/refresh-token`

Obtiene un nuevo token de acceso usando un token de refresco.

**Request:**

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### `GET /auth/profile`

Obtiene el perfil del usuario autenticado.

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
  "roles": ["user"]
}
```

### `POST /auth/change-password`

Cambia la contraseña del usuario autenticado.

**Headers:**

```text
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Request:**

```json
{
  "currentPassword": "contraseña123",
  "newPassword": "nuevaContraseña456"
}
```

**Response:**

```json
{
  "message": "Contraseña actualizada correctamente"
}
```
