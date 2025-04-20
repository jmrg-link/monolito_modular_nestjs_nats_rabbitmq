import { RmqOptions, Transport } from "@nestjs/microservices";

/**
 * Configuración centralizada para las conexiones RabbitMQ
 * Asegura consistencia entre la API Gateway y los microservicios
 */
export const rmqConfig: {
  transport: Transport.RMQ;
  options: RmqOptions["options"];
} = {
  transport: Transport.RMQ,
  options: {
    urls: [
      process.env.RABBITMQ_URL ||
        "amqp://rabbit_user:rabbit_password@localhost:5672",
    ],
    queue: "main_queue",
    queueOptions: {
      durable: true,
    },
    prefetchCount: 1,
    noAck: false,
    persistent: true,
  },
};

/**
 * Definición de intercambios y colas para RabbitMQ
 */
export const RMQ_EXCHANGES = {
  USER: "user_exchange",
  ORDER: "order_exchange",
  PRODUCT: "product_exchange",
};

/**
 * Patrones de eventos para RabbitMQ
 */
export const RMQ_PATTERNS = {
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
 * Patrones de mensajes para RabbitMQ (comunicación de solicitud-respuesta)
 */
export const RMQ_MESSAGE_PATTERNS = {
  USER: {
    FIND_BY_EMAIL: "users.findByEmail",
    FIND_BY_ID: "users.findById",
    CREATE: "users.create",
    UPDATE_PASSWORD: "users.updatePassword",
  },
};
