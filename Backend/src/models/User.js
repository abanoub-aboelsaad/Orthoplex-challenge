// User model - re-exports repository functions
// Database initialization is handled in src/config/initDatabase.js

// Re-export all repository functions for backward compatibility
export {
  createUser,
  getUserById,
  getUserWithPasswordByEmail,
  verifyUserByEmail,
  updateUser,
  deleteUser,
  listUsers,
  recordLogin,
  countTotalUsers,
  countVerifiedUsers,
  topUsersByLogin,
  inactiveUsers,
  emailExists,
  getUserStatistics,
  getUsersByRole,
  getRecentUsers,
  searchUsers,
} from "../repositories/user.repository.js";
