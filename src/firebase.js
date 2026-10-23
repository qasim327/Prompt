/**
 * PromptVault - Firebase Configuration
 * Exports modular SDK v10 auth, db, storage, and helper constants.
 * Hardcoded Super Admin: alisahab62525@gmail.com
 */
export {
  auth,
  db,
  storage,
  googleProvider,
  SUPER_ADMIN_EMAIL,
  isSuperAdmin,
  handleFirestoreError,
  OperationType,
} from './firebase.ts';
