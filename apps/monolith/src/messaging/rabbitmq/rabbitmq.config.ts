/**
 * Configuración específica para conexiones RabbitMQ en el monolito
 * Se utilizan solo para conexiones manuales (no para microservicios NestJS)
 */
export const rabbitMqConfig = {
  // URL de conexión
  url:
    process.env.RABBITMQ_URL ||
    "amqp://rabbit_user:rabbit_password@localhost:5672",

  exchanges: {
    user: {
      name: "user_exchange",
      type: "topic",
      options: {
        durable: true,
      },
    },
    order: {
      name: "order_exchange",
      type: "topic",
      options: {
        durable: true,
      },
    },
    product: {
      name: "product_exchange",
      type: "topic",
      options: {
        durable: true,
      },
    },
    dlx: {
      name: "dlx_exchange",
      type: "topic",
      options: {
        durable: true,
      },
    },
  },

  queues: {
    main: {
      name: "main_queue",
      options: {
        durable: true,
      },
    },
    user: {
      name: "user_events",
      options: {
        durable: true,
        arguments: {
          "x-dead-letter-exchange": "dlx_exchange",
          "x-dead-letter-routing-key": "dead.user",
        },
      },
    },
    order: {
      name: "order_events",
      options: {
        durable: true,
        arguments: {
          "x-dead-letter-exchange": "dlx_exchange",
          "x-dead-letter-routing-key": "dead.order",
        },
      },
    },
    product: {
      name: "product_events",
      options: {
        durable: true,
        arguments: {
          "x-dead-letter-exchange": "dlx_exchange",
          "x-dead-letter-routing-key": "dead.product",
        },
      },
    },
    dlq: {
      name: "dead_letter_queue",
      options: {
        durable: true,
      },
    },
  },

  // Configuración de bindings
  bindings: [
    {
      exchange: "user_exchange",
      queue: "user_events",
      pattern: "user.#",
    },
    {
      exchange: "order_exchange",
      queue: "order_events",
      pattern: "order.#",
    },
    {
      exchange: "product_exchange",
      queue: "product_events",
      pattern: "product.#",
    },
    {
      exchange: "dlx_exchange",
      queue: "dead_letter_queue",
      pattern: "dead.#",
    },
  ],
};
