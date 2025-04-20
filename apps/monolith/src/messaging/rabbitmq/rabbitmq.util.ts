/**
 * Utilidades para configuración manual de RabbitMQ.
 * @module RabbitMQUtil
 * @description Proporciona funciones para crear, eliminar y configurar recursos en RabbitMQ
 */
import * as amqplib from "amqplib";
import { Logger } from "@nestjs/common";
import { rabbitMqConfig } from "./rabbitmq.config";

const logger = new Logger("RabbitMQUtil");

/**
 * Elimina una cola de RabbitMQ para permitir recrearla con nuevas propiedades.
 * PRECAUCIÓN: Esto eliminará todos los mensajes en la cola.
 * @param {string} queueName - Nombre de la cola a eliminar
 * @returns {Promise<boolean>} - true si la operación fue exitosa, false en caso contrario
 * @throws No lanza excepciones directamente, las maneja internamente
 */
export async function deleteQueue(queueName: string) {
  try {
    const connection = await amqplib.connect(rabbitMqConfig.url);
    const channel = await connection.createChannel();

    await channel.deleteQueue(queueName);
    await channel.close();
    await connection.close();

    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Error al eliminar la cola ${queueName}: ${errorMessage}`);
    return false;
  }
}

/**
 * Configura toda la infraestructura de RabbitMQ manualmente.
 * @returns {Promise<boolean>} - true si la operación fue exitosa, false en caso contrario
 * @throws No lanza excepciones directamente, las maneja internamente
 * @description Configura exchanges, colas y bindings según la configuración definida
 */
export async function setupRabbitMQInfrastructure() {
  try {
    const connection = await amqplib.connect(rabbitMqConfig.url);
    const channel = await connection.createChannel();
    for (const [ key, exchange ] of Object.entries(rabbitMqConfig.exchanges))
    {
      await channel.assertExchange(
        exchange.name,
        exchange.type,
        exchange.options,
      );
    }

    if (rabbitMqConfig.queues.dlq) {
      try {
        const dlqName = rabbitMqConfig.queues.dlq.name;
        await channel.assertQueue(dlqName, rabbitMqConfig.queues.dlq.options);
      } catch (dlqError: unknown) {
        const errorMessage =
          dlqError instanceof Error ? dlqError.message : String(dlqError);
        logger.error(
          `Error configurando cola de letra muerta: ${errorMessage}`,
        );
      }
    }

    for (const [key, queue] of Object.entries(rabbitMqConfig.queues)) {
      if (key === "dlq") continue;
      try {
        const checkQueue = await channel
          .checkQueue(queue.name)
          .catch(() => null);

        if (!checkQueue) {
          await channel.assertQueue(queue.name, queue.options);
        }
      } catch (queueError: unknown) {
        const errorMessage =
          queueError instanceof Error ? queueError.message : String(queueError);
        logger.warn(
          `No se pudo verificar/crear la cola ${queue.name}: ${errorMessage}`,
        );
      }
    }

    const dlxBindings = rabbitMqConfig.bindings.filter(
      (b) => b.queue === rabbitMqConfig.queues.dlq?.name,
    );
    for (const binding of dlxBindings) {
      await channel.bindQueue(binding.queue, binding.exchange, binding.pattern);
    }

    const regularBindings = rabbitMqConfig.bindings.filter(
      (b) => b.queue !== rabbitMqConfig.queues.dlq?.name,
    );
    for (const binding of regularBindings) {
      await channel.bindQueue(binding.queue, binding.exchange, binding.pattern);
    }

    await channel.close();
    await connection.close();

    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Error al configurar RabbitMQ: ${errorMessage}`);
    return false;
  }
}

/**
 * Recrea una cola para aplicar nueva configuración.
 * @param {string} queueName - Nombre de la cola a recrear
 * @returns {Promise<boolean>} - true si la operación fue exitosa, false en caso contrario
 * @throws No lanza excepciones directamente, las maneja internamente
 * @description Elimina y vuelve a crear una cola con sus bindings y configuración DLX si es aplicable
 */
export async function recreateQueue(queueName: string) {
  try {
    // Buscar la configuración de la cola
    const queueConfig = Object.values(rabbitMqConfig.queues).find(
      (q) => q.name === queueName,
    );

    if (!queueConfig) {
      logger.error(`No se encontró configuración para la cola: ${queueName}`);
      return false;
    }

    // Eliminar la cola existente
    const deleteResult = await deleteQueue(queueName);
    if (!deleteResult) {
      logger.warn(
        `No se pudo eliminar la cola ${queueName}, intentando crear de todos modos...`,
      );
    }

    // Verificar si necesitamos configurar el exchange DLX primero
    const dlxExchangeName = (queueConfig.options as any)?.arguments?.[
      "x-dead-letter-exchange"
    ];

    // Establecer conexión
    const connection = await amqplib.connect(rabbitMqConfig.url);
    const channel = await connection.createChannel();

    // Si hay un DLX configurado, asegurarse de que existe
    if (dlxExchangeName) {
      const dlxExchange = Object.values(rabbitMqConfig.exchanges).find(
        (e) => e.name === dlxExchangeName,
      );
      if (dlxExchange) {
        await channel.assertExchange(
          dlxExchangeName,
          dlxExchange.type,
          dlxExchange.options,
        );
      } else {
        // Usar topic como tipo por defecto
        await channel.assertExchange(dlxExchangeName as string, "topic", {
          durable: true,
        });
      }

      // Verificar si la cola DLQ existe
      const dlqName = (queueConfig.options as any)?.arguments?.[
        "x-dead-letter-routing-key"
      ]
        ?.split(".")
        ?.at(1);
      if (dlqName) {
        const fullDlqName = `dead_letter_${dlqName}`;
        try {
          await channel.assertQueue(fullDlqName, { durable: true });
          await channel.bindQueue(
            fullDlqName,
            dlxExchangeName as string,
            `dead.${dlqName}`,
          );
        } catch (dlqError: unknown) {
          const errorMessage =
            dlqError instanceof Error ? dlqError.message : String(dlqError);
          logger.warn(
            `No se pudo configurar la cola DLQ ${fullDlqName}: ${errorMessage}`,
          );
        }
      }
    }

    // Crear la cola con las nuevas opciones
    await channel.assertQueue(queueName, queueConfig.options);

    // Buscar y restaurar los bindings asociados
    const relatedBindings = rabbitMqConfig.bindings.filter(
      (b) => b.queue === queueName,
    );
    for (const binding of relatedBindings) {
      await channel.bindQueue(queueName, binding.exchange, binding.pattern);
    }

    // Cerrar conexión
    await channel.close();
    await connection.close();

    logger.log(`Cola ${queueName} recreada correctamente`);
    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Error al recrear la cola ${queueName}: ${errorMessage}`);
    return false;
  }
}
