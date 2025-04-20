#!/bin/sh

set -e

# Esperar a que RabbitMQ esté listo
MAX_RETRIES=30
RETRY_COUNT=0

echo "[$(date)] Esperando a que RabbitMQ inicie..."
until rabbitmq-diagnostics check_running 2>/dev/null || [ $RETRY_COUNT -eq $MAX_RETRIES ]; do
  echo "[$(date)] Intentando conexión a RabbitMQ ($RETRY_COUNT/$MAX_RETRIES)"
  RETRY_COUNT=$((RETRY_COUNT+1))
  sleep 5
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
  echo "[$(date)] Error: No se pudo conectar a RabbitMQ después de $MAX_RETRIES intentos"
  exit 1
fi

echo "[$(date)] RabbitMQ está en funcionamiento"

# Verificar si hay exchanges ya definidos
EXCHANGES=$(rabbitmqadmin list exchanges)

# Si no se han creado los exchanges a través de definitions.json, crearlos manualmente
if ! echo "$EXCHANGES" | grep -q "order_exchange"; then
  echo "Creando exchanges y colas..."

  # Crear exchanges
  rabbitmqadmin declare exchange name=order_exchange type=topic durable=true
  rabbitmqadmin declare exchange name=user_exchange type=topic durable=true
  rabbitmqadmin declare exchange name=product_exchange type=topic durable=true

  # Crear colas
  rabbitmqadmin declare queue name=main_queue durable=true
  rabbitmqadmin declare queue name=order_events durable=true
  rabbitmqadmin declare queue name=user_events durable=true
  rabbitmqadmin declare queue name=product_events durable=true

  # Establecer bindings
  rabbitmqadmin declare binding source=order_exchange destination=order_events routing_key="order.#"
  rabbitmqadmin declare binding source=user_exchange destination=user_events routing_key="user.#"
  rabbitmqadmin declare binding source=product_exchange destination=product_events routing_key="product.#"

  echo "Exchanges y colas creados correctamente"
else
  echo "Los exchanges ya están configurados"
fi