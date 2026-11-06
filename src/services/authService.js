/**
 * @file authService.js
 * Servicio de fachada para el sistema de autenticación administrativa de ARIQ.
 * Interfaz unificada hacia `src/firebase/auth.js` sin ninguna dependencia de Firebase Auth SDK.
 */

import {
  loginWithCredentials,
  logoutUser,
  getCurrentUser,
  hasPermission,
  listAdminUsers,
  createAdminUser,
  updateAdminUser,
  changeAdminUserPassword,
  unlockAdminUser,
  deleteAdminUser,
} from '../firebase/auth.js';

export const authService = {
  /**
   * Obtiene la sesión activa actual
   */
  getCurrentUser() {
    return getCurrentUser();
  },

  /**
   * Inicio de sesión mediante usuario/email y contraseña con verificación bcrypt
   */
  async login(identifier, password) {
    return loginWithCredentials(identifier, password);
  },

  /**
   * Cierre de sesión y revocación en Firestore
   */
  async logout() {
    return logoutUser();
  },

  /**
   * Comprobación jerárquica de permisos (admin > editor > operador)
   */
  hasPermission(userRole, requiredRole) {
    return hasPermission(userRole, requiredRole);
  },

  /**
   * Listar usuarios administrativos
   */
  async listUsers() {
    return listAdminUsers();
  },

  /**
   * Crear nuevo usuario administrativo
   */
  async createUser(data) {
    return createAdminUser(data);
  },

  /**
   * Modificar rol o activar/desactivar usuario
   */
  async updateUser(userId, data) {
    return updateAdminUser(userId, data);
  },

  /**
   * Modificar contraseña de usuario
   */
  async changePassword(userId, newPassword) {
    return changeAdminUserPassword(userId, newPassword);
  },

  /**
   * Desbloquear usuario bloqueado por fuerza bruta
   */
  async unlockUser(userId) {
    return unlockAdminUser(userId);
  },

  /**
   * Eliminar usuario
   */
  async deleteUser(userId) {
    return deleteAdminUser(userId);
  },
};
