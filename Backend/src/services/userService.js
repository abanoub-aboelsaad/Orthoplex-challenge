import { sanitizeUserInput } from "../utils/sanitization.js";
import { hashPassword, comparePassword } from "../utils/passwordHash.js";
import { signJwt } from "../utils/jwtUtils.js";
import {
  ERROR_CODES,
  VERIFICATION_STATUS,
  PAGINATION,
} from "../enums/enums.js";
// Import from repository for better separation of concerns
import {
  createUser,
  getUserById,
  getUserWithPasswordByEmail,
  updateUser as updateUserModel,
  deleteUser as deleteUserModel,
  listUsers,
  verifyUserByEmail,
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
import { createHttpError } from "../middleware/errorHandler.js";

export async function registerUser({
  name,
  email,
  password,
  role = USER_ROLES.USER,
}) {
  const sanitized = sanitizeUserInput({ name, email });
  const existing = await getUserWithPasswordByEmail(sanitized.email);
  if (existing)
    throw createHttpError(409, "Email already in use", ERROR_CODES.EMAIL_TAKEN);
  const passwordHash = await hashPassword(password);

  // Check if auto-verification is enabled via environment variable
  const autoVerify = process.env.AUTO_VERIFY_USERS === "true";
  const user = await createUser({
    name: sanitized.name,
    email: sanitized.email,
    passwordHash,
    role: role,
    isVerified: autoVerify
      ? VERIFICATION_STATUS.VERIFIED
      : VERIFICATION_STATUS.UNVERIFIED,
  });
  return user;
}

export async function loginUser({ email, password }) {
  const user = await getUserWithPasswordByEmail(String(email).toLowerCase());
  if (!user)
    throw createHttpError(
      401,
      "Invalid credentials",
      ERROR_CODES.INVALID_CREDENTIALS
    );
  if (user.is_verified !== VERIFICATION_STATUS.VERIFIED)
    throw createHttpError(403, "User not verified", ERROR_CODES.NOT_VERIFIED);
  const valid = await comparePassword(password, user.password_hash);
  if (!valid)
    throw createHttpError(
      401,
      "Invalid credentials",
      ERROR_CODES.INVALID_CREDENTIALS
    );
  await recordLogin(user.id);
  const token = signJwt({ id: user.id, email: user.email, role: user.role });
  return { token, user: await getUserById(user.id) };
}

export async function verifyUser({ email }) {
  const user = await verifyUserByEmail(String(email).toLowerCase());
  if (!user)
    throw createHttpError(404, "User not found", ERROR_CODES.NOT_FOUND);
  return user;
}

export async function getUser(id) {
  const user = await getUserById(id);
  if (!user)
    throw createHttpError(404, "User not found", ERROR_CODES.NOT_FOUND);
  return user;
}

export async function updateUser(id, data) {
  const sanitized = sanitizeUserInput(data);
  if (sanitized.email) {
    const existing = await getUserWithPasswordByEmail(sanitized.email);
    if (existing && existing.id !== Number(id))
      throw createHttpError(
        409,
        "Email already in use",
        ERROR_CODES.EMAIL_TAKEN
      );
  }
  const updated = await updateUserModel(id, sanitized);
  if (!updated)
    throw createHttpError(404, "User not found", ERROR_CODES.NOT_FOUND);
  return updated;
}

export async function deleteUser(id) {
  const affected = await deleteUserModel(id);
  if (!affected)
    throw createHttpError(404, "User not found", ERROR_CODES.NOT_FOUND);
}

export async function listUsersService(filters) {
  return listUsers(filters);
}

export async function getTotals() {
  const [total, verified] = await Promise.all([
    countTotalUsers(),
    countVerifiedUsers(),
  ]);
  return { totalUsers: total, totalVerifiedUsers: verified };
}

export async function getTopUsersByLogin(limit = PAGINATION.DEFAULT_LIMIT) {
  return topUsersByLogin(limit);
}

export async function getInactiveUsers({ hours, months } = {}) {
  return inactiveUsers({ hours, months });
}

// New service functions using additional repository methods

export async function checkEmailExists(email) {
  return emailExists(email);
}

export async function getUserStatisticsService() {
  return getUserStatistics();
}

export async function getUsersByRoleService(role) {
  return getUsersByRole(role);
}

export async function getRecentUsersService(days = 7) {
  return getRecentUsers(days);
}

export async function searchUsersService(searchCriteria) {
  return searchUsers(searchCriteria);
}

export async function getRegistrationStatisticsService({ startDate, endDate }) {
  const { getRegistrationStatistics } = await import(
    "../repositories/user.repository.js"
  );
  return getRegistrationStatistics({ startDate, endDate });
}
