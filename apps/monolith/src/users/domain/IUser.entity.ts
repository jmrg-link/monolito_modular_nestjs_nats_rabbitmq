import { Permission, Role } from "@libs/common/src/auth/enums/role.enum";
import { Schema } from "mongoose";

/**
 * Define el contrato base para la entidad User en el dominio
 * Esta interfaz establece el modelo de datos flexible que permite construir objetos de usuario
 * con propiedades opcionales. La validación y obligatoriedad se delegan a las capas superiores
 * como DTOs, servicios y repositorios siguiendo principios de responsabilidad única.
 * @interface IUserEntity
 * @module Users/Domain/Interface
 * @property {string | undefined | Schema.Types.ObjectId} id - Identificador único del usuario
 * @property {string | undefined} email - Correo electrónico del usuario
 * @property {string | undefined} username - Nombre de usuario único en el sistema
 * @property {string | undefined} name - Nombre completo o de visualización
 * @property {Role[] | undefined} roles - Lista de roles asignados al usuario
 * @property {boolean | undefined} isActive - Indicador de estado activo de la cuenta
 * @property {Permission[] | undefined} permissions - Permisos específicos asignados
 * @property {string[] | undefined} customPermissions - Permisos personalizados no estándar
 * @property {string | undefined} firstName - Nombre de pila del usuario
 * @property {string | undefined} lastName - Apellidos del usuario
 * @property {boolean | undefined} emailVerified - Estado de verificación del correo electrónico
 * @property {string | undefined} phoneNumber - Número de teléfono de contacto
 * @property {Object | undefined} address - Dirección postal completa del usuario
 * @property {string} street - Calle y número
 * @property {string} city - Ciudad
 * @property {string} state - Estado o provincia
 * @property {string} postalCode - Código postal
 * @property {string} country - País
 * @property {string | undefined} avatarUrl - URL de la imagen de perfil del usuario
 * @property {Date | undefined} lastLoginAt - Fecha y hora del último inicio de sesión
 * @property {Object | undefined} preferences - Preferencias configurables del usuario
 * @property {string} language - Idioma preferido
 * @property {string} currency - Moneda preferida para transacciones
 * @property {string} timezone - Zona horaria para fechas
 * @property {Object} notifications - Configuración de notificaciones
 * @property {boolean} notifications.email - Notificaciones por correo
 * @property {boolean} notifications.sms - Notificaciones por SMS
 * @property {boolean} notifications.marketing - Notificaciones de marketing
 * @property {Object | undefined} securitySettings - Configuración de seguridad del usuario
 * @property {boolean} securitySettings.mfaEnabled - Estado de autenticación de dos factores
 * @property {boolean} securitySettings.loginNotifications - Notificaciones de inicio de sesión
 * @property {boolean} securitySettings.passwordChangeRequired - Indicador de cambio de contraseña requerido
 * @property {Date|null} securitySettings.passwordExpiresAt - Fecha de expiración de la contraseña
 * @property {Array<Object>} securityQuestions - Preguntas de seguridad para recuperación
 * @property {string} securityQuestions[].question - Pregunta de seguridad
 * @property {string} securityQuestions[].answerHash - Hash de la respuesta
 * @property {Date | undefined} passwordChangedAt - Fecha del último cambio de contraseña
 * @property {Date | undefined} birthDate - Fecha de nacimiento del usuario
 * @property {Date | undefined} createdAt - Fecha de creación de la cuenta
 * @property {Date | undefined} updatedAt - Fecha de última actualización
 * @property {Date | undefined} deletedAt - Fecha de eliminación lógica
 * @property {Array<Object> | undefined} devices - Lista de dispositivos desde los que ha accedido el usuario
 * @property {string} deviceId - Identificador único del dispositivo
 * @property {string} platform - Plataforma del dispositivo
 * @property {Date} lastLoginAt - Fecha del último acceso
 * @property {boolean} isTrusted - Indicador de dispositivo de confianza
 * @description Esta interfaz representa la entidad de usuario en el dominio de la aplicación.
 */
export interface IUserEntity {
  id?: string | undefined | Schema.Types.ObjectId;
  email?: string;
  username?: string;
  name?: string;
  roles?: Role[];
  isActive?: boolean;
  permissions?: Permission[];
  customPermissions?: string[];
  firstName?: string;
  lastName?: string;
  emailVerified?: boolean;
  phoneNumber?: string;

  /**
   * @type {Object | undefined} address - Dirección postal completa del usuario
   * @property {string} street - Calle y número
   * @property {string} city - Ciudad
   * @property {string} state - Estado o provincia
   * @property {string} postalCode - Código postal
   * @property {string} country - País
   */
  address?: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };

  avatarUrl?: string;
  lastLoginAt?: Date;

  /**
   * @type {Object | undefined} preferences - Preferencias configurables del usuario
   * @property {string} language - Idioma preferido
   * @property {string} currency - Moneda preferida para transacciones
   * @property {string} timezone - Zona horaria para fechas
   * @property {Object} notifications - Configuración de notificaciones
   * @property {boolean} notifications.email - Notificaciones por correo
   * @property {boolean} notifications.sms - Notificaciones por SMS
   * @property {boolean} notifications.marketing - Notificaciones de marketing
   * @property {boolean} notifications.push - Notificaciones push
   */
  preferences?: {
    language: string;
    currency: string;
    timezone: string;
    notifications: {
      email: boolean;
      sms: boolean;
      marketing: boolean;
      push: boolean;
    };
  };

  /**
   * @type {Object | undefined} securitySettings - Configuración de seguridad del usuario
   * @property {boolean} mfaEnabled - Estado de autenticación de dos factores
   * @property {boolean} loginNotifications - Notificaciones de inicio de sesión
   * @property {boolean} passwordChangeRequired - Indicador de cambio de contraseña requerido
   * @property {Date|null} passwordExpiresAt - Fecha de expiración de la contraseña
   * @property {Array<Object>} securityQuestions - Preguntas de seguridad para recuperación
   * @property {string} securityQuestions[].question - Pregunta de seguridad
   * @property {string} securityQuestions[].answerHash - Hash de la respuesta
   */
  securitySettings?: {
    mfaEnabled: boolean;
    loginNotifications: boolean;
    passwordChangeRequired: boolean;
    passwordExpiresAt: Date | null;
    securityQuestions: Array<{
      question: string;
      answerHash: string;
    }>;
  };

  passwordHash?: string;
  passwordChangedAt?: Date;
  birthDate?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;

  /**
   * @type {Array<Object> | undefined} devices - Lista de dispositivos desde los que ha accedido el usuario
   * @property {string} deviceId - Identificador único del dispositivo
   * @property {string} platform - Plataforma del dispositivo
   * @property {Date} lastLoginAt - Fecha del último acceso
   * @property {boolean} isTrusted - Indicador de dispositivo de confianza
   */
  devices?: Array<{
    deviceId: string;
    platform: string;
    lastLoginAt: Date;
    isTrusted: boolean;
  }>;
}
