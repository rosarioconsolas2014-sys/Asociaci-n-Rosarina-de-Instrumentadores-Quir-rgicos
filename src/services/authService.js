import {
  loginWithEmail,
  logoutUser,
  getCurrentUser,
  hasPermission,
  signInWithGoogle,
  DEMO_USERS,
  getUserProfile,
} from '../firebase/auth.js';

export const authService = {
  getDemoUsers() {
    return DEMO_USERS;
  },

  getCurrentUser() {
    return getCurrentUser();
  },

  async login(email, password) {
    return loginWithEmail(email, password);
  },

  async loginGoogle() {
    return signInWithGoogle();
  },

  async logout() {
    return logoutUser();
  },

  hasPermission(userRole, requiredRole) {
    return hasPermission(userRole, requiredRole);
  },

  async getProfile(uid, email) {
    return getUserProfile(uid, email);
  },
};
