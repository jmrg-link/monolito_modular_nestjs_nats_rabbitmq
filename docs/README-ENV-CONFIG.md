# Configuración de Entorno del Ecosistema de Microservicios

Este documento describe el sistema de configuración de entorno para el proyecto NestJS DDD Microservices Ecosystem.

## Descripción General

El proyecto utiliza un robusto sistema de configuración de entorno que soporta diferentes entornos:

- Desarrollo (`development`)
- Pruebas (`test`)
- Producción (`production`)
- Local (`localhost`)

## Archivos de Configuración

Los archivos de configuración específicos para cada entorno se encuentran en el directorio raíz:

- `.env.development` - Configuración para entorno de desarrollo
- `.env.localhost` - Configuración para entorno local
- `.env.test` - Configuración para entorno de pruebas
- `.env` - Configuración para entorno de producción

## Uso con Docker Compose

### Iniciando con un Entorno Específico

Docker Compose selecciona automáticamente la configuración de entorno apropiada:

```bash
# Entorno de producción (predeterminado)
docker-compose up -d

# Entorno de desarrollo
docker-compose --env-file .env.development up -d

# Entorno local
docker-compose --env-file .env.localhost up -d
```

### Configuración de Parámetros Personalizados

También puedes construir imágenes con configuraciones específicas:

```bash
docker-compose build --build-arg NODE_ENV=development
```

## Estructura de Configuración

La configuración está organizada en secciones lógicas:

1. **Entorno** - Identificación básica del entorno
2. **Servidor** - Configuración de servidores HTTP
3. **Seguridad** - Autenticación, CORS y limitación de tasa
4. **Mensajería** - Configuración de NATS y RabbitMQ
5. **Base de Datos** - Configuración de MongoDB
6. **Microservicios** - Detalles de conexión a otros servicios
7. **Swagger** - Configuración de documentación API

## Opciones de Configuración Disponibles

A continuación, se muestran las variables de entorno disponibles con sus descripciones:

### Entorno

- `NODE_ENV` - Entorno actual (`development`, `test`, o `production`)

### Configuración de Servidores

- `PORT` - Puerto del servidor API Gateway
- `PORT_MONOLITH` - Puerto del servidor Monolito
- `HOST` - Nombre de host de los servidores
- `API_PREFIX` - Prefijo global de la ruta API

### Seguridad

- `JWT_SECRET` - Clave secreta para tokens JWT
- `JWT_EXPIRES_IN` - Tiempo de expiración del token JWT (en segundos)
- `JWT_REFRESH_SECRET` - Clave secreta para tokens de refresco
- `JWT_REFRESH_EXPIRES_IN` - Tiempo de expiración del token de refresco (en segundos)
- `CORS_ORIGIN` - Orígenes permitidos para CORS

### Mensajería

- `NATS_URL` - URL del servidor NATS
- `RABBITMQ_USER` - Usuario de RabbitMQ
- `RABBITMQ_PASS` - Contraseña de RabbitMQ
- `RABBITMQ_URL` - URL del servidor RabbitMQ
- `RABBITMQ_QUEUE` - Nombre de la cola RabbitMQ

### Base de Datos

- `MONGO_USER` - Usuario de MongoDB
- `MONGO_PASSWORD` - Contraseña de MongoDB
- `MONGO_DATABASE` - Nombre de la base de datos MongoDB
- `MONGODB_URI` - URI completa de conexión a MongoDB
- `MONGODB_DBNAME` - Nombre de la base de datos MongoDB

## Acceso a la Configuración en el Código

La configuración es accesible en el código a través de los objetos `ApiGatewayConfig` o `MonolithConfig`:

```typescript
// En el API Gateway
import { ApiGatewayConfig } from "./config/app.config";
const port = ApiGatewayConfig.server.port;

// En el Monolito
import { MonolithConfig } from "./config/app.config";
const mongoUri = MonolithConfig.database.uri;
```

## Cómo Funciona la Configuración para Docker

La configuración de entorno para Docker se gestiona de la siguiente manera:

1. Las variables definidas en `.env` (o en el archivo especificado con `--env-file`) se cargan en el entorno de Docker Compose
2. Estas variables son utilizadas por Docker Compose para configurar los servicios y contenedores
3. Las variables se pasan a los contenedores a través de la sección `environment` en el archivo `docker-compose.yml`
4. Dentro de los contenedores, las aplicaciones acceden a estas variables a través de los objetos de configuración centralizados

Este enfoque permite una administración coherente de la configuración a través de todos los componentes del ecosistema de microservicios.
