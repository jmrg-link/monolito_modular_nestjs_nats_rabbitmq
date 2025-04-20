// Este script se ejecutará cuando el contenedor MongoDB se inicialice por primera vez
// El usuario root de MongoDB ya se crea con las credenciales de las variables de entorno

// Creamos un usuario específico para la aplicación con permisos adecuados
db.createUser({
  user: "app_user",
  pwd: "app_password",
  roles: [
    { role: "readWrite", db: "app" },
    { role: "dbAdmin", db: "app" },
  ],
});

// Verificar que el usuario tiene los permisos correctos
print("Verificando usuarios y permisos configurados...");

// Creamos las colecciones e índices

db.createCollection("users");
db.createCollection("products");
db.createCollection("orders");
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ roles: 1 });
db.products.createIndex({ name: 1 });
db.products.createIndex({ price: 1 });
db.orders.createIndex({ userId: 1 });
db.orders.createIndex({ status: 1 });
db.orders.createIndex({ createdAt: -1 });
