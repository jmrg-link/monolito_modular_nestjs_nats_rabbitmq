import { NatsOptions, Transport } from "@nestjs/microservices";

/**
 * Configuración centralizada para las conexiones NATS
 * Asegura consistencia entre la API Gateway y los microservicios
 */
export const natsConfig: {
  transport: Transport.NATS;
  options: NatsOptions["options"];
} = {
  transport: Transport.NATS,
  options: {
    servers: [process.env.NATS_URL || "nats://localhost:4222"],
    timeout: 10000,
    reconnect: true,
    reconnectTimeWait: 1000,
    maxReconnectAttempts: 10,
  },
};

/**
 * Patrones de eventos para NATS
 */
export const NATS_PATTERNS = {
  USER: {
    CREATED: "user.created",
    REGISTERED: "user.registered",
    PASSWORD_CHANGED: "user.passwordChanged",
    DEACTIVATED: "user.deactivated",
    ACTIVATED: "user.activated",
    LOGGED_IN: "user.loggedIn",
  },
  ORDER: {
    CREATED: "order.created",
    PAID: "order.paid",
    SHIPPED: "order.shipped",
    DELIVERED: "order.delivered",
    CANCELLED: "order.cancelled",
  },
  PRODUCT: {
    CREATED: "product.created",
    UPDATED: "product.updated",
    DELETED: "product.deleted",
    STOCK_CHANGED: "product.stockChanged",
  },
};

/**
 * Patrones de mensajes para NATS (comunicación de solicitud-respuesta)
 */
export const NATS_MESSAGE_PATTERNS = {
  USER: {
    FIND_BY_EMAIL: "users.findByEmail",
    FIND_BY_ID: "users.findById",
    CREATE: "users.create",
    UPDATE_PASSWORD: "users.updatePassword",
  },
};
