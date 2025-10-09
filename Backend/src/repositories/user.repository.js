import { query } from "../config/database.js";
import { USER_ROLES, VERIFICATION_STATUS, TABLES } from "../enums/enums.js";

export async function createUser({
  name,
  email,
  passwordHash,
  role = USER_ROLES.USER,
}) {
  const result = await query(
    `INSERT INTO ${TABLES.USERS} (name, email, password_hash, role) VALUES (?, ?, ?, ?)`,
    [name, email, passwordHash, role]
  );
  return getUserById(result.insertId);
}

/**
 * Get user by ID
 */
export async function getUserById(id) {
  const rows = await query(
    `SELECT id, name, email, role, is_verified, created_at, updated_at FROM ${TABLES.USERS} WHERE id = ?`,
    [id]
  );
  return rows[0] || null;
}

/**
 * Get user with password by email (for authentication)
 */
export async function getUserWithPasswordByEmail(email) {
  const rows = await query(`SELECT * FROM ${TABLES.USERS} WHERE email = ?`, [
    email,
  ]);
  return rows[0] || null;
}

/**
 * Verify user by email
 */
export async function verifyUserByEmail(email) {
  await query(`UPDATE ${TABLES.USERS} SET is_verified = ? WHERE email = ?`, [
    VERIFICATION_STATUS.VERIFIED,
    email,
  ]);
  const rows = await query(
    `SELECT id, name, email, role, is_verified, created_at, updated_at FROM ${TABLES.USERS} WHERE email = ?`,
    [email]
  );
  return rows[0] || null;
}

/**
 * Update user information
 */
export async function updateUser(id, { name, email }) {
  const fields = [];
  const params = [];

  if (name !== undefined) {
    fields.push("name = ?");
    params.push(name);
  }

  if (email !== undefined) {
    fields.push("email = ?");
    params.push(email);
  }

  if (!fields.length) return getUserById(id);

  params.push(id);
  await query(
    `UPDATE ${TABLES.USERS} SET ${fields.join(", ")} WHERE id = ?`,
    params
  );
  return getUserById(id);
}

/**
 * Delete user by ID
 */
export async function deleteUser(id) {
  const result = await query(`DELETE FROM ${TABLES.USERS} WHERE id = ?`, [id]);
  return result?.affectedRows || 0;
}

/**
 * List users with advanced filtering and pagination
 */
export async function listUsers({
  page = 1,
  limit = 10,
  name,
  email,
  isVerified,
  role,
  startDate,
  endDate,
  sortBy = "created_at",
  sortOrder = "DESC",
  search,
  hasLogins,
  lastLoginAfter,
  lastLoginBefore,
}) {
  const offset = (page - 1) * limit;
  let whereClause = "";
  let params = [];

  // Build WHERE clause
  const conditions = [];

  // Basic filters
  if (name) {
    conditions.push("name LIKE ?");
    params.push(`%${name}%`);
  }

  if (email) {
    conditions.push("email LIKE ?");
    params.push(`%${email}%`);
  }

  if (isVerified !== undefined) {
    conditions.push("is_verified = ?");
    params.push(isVerified ? 1 : 0);
  }

  if (role) {
    conditions.push("role = ?");
    params.push(role);
  }

  if (startDate) {
    conditions.push("created_at >= ?");
    params.push(startDate);
  }

  if (endDate) {
    conditions.push("created_at <= ?");
    params.push(endDate);
  }

  // Advanced search
  if (search) {
    conditions.push("(name LIKE ? OR email LIKE ?)");
    params.push(`%${search}%`, `%${search}%`);
  }

  // Login-based filters
  if (hasLogins !== undefined) {
    if (hasLogins) {
      conditions.push("u.id IN (SELECT DISTINCT user_id FROM user_logins)");
    } else {
      conditions.push("u.id NOT IN (SELECT DISTINCT user_id FROM user_logins)");
    }
  }

  if (lastLoginAfter) {
    conditions.push(
      "u.id IN (SELECT user_id FROM user_logins WHERE logged_in_at >= ?)"
    );
    params.push(lastLoginAfter);
  }

  if (lastLoginBefore) {
    conditions.push(
      "u.id IN (SELECT user_id FROM user_logins WHERE logged_in_at <= ?)"
    );
    params.push(lastLoginBefore);
  }

  if (conditions.length > 0) {
    whereClause = "WHERE " + conditions.join(" AND ");
  }

  // Validate sort parameters
  const allowedSortFields = [
    "id",
    "name",
    "email",
    "role",
    "is_verified",
    "created_at",
    "updated_at",
  ];
  const allowedSortOrders = ["ASC", "DESC"];

  const validSortBy = allowedSortFields.includes(sortBy)
    ? sortBy
    : "created_at";
  const validSortOrder = allowedSortOrders.includes(sortOrder.toUpperCase())
    ? sortOrder.toUpperCase()
    : "DESC";

  // Get users with login count
  const usersQuery = `SELECT u.id, u.name, u.email, u.role, u.is_verified, u.created_at, u.updated_at,
                     COUNT(l.id) as login_count,
                     MAX(l.logged_in_at) as last_login
                     FROM ${TABLES.USERS} u
                     LEFT JOIN user_logins l ON l.user_id = u.id
                     ${whereClause}
                     GROUP BY u.id
                     ORDER BY ${validSortBy} ${validSortOrder}
                     LIMIT ${limit} OFFSET ${offset}`;

  const rows = await query(usersQuery, params);

  // Get total count (without login joins for performance)
  const countQuery = `SELECT COUNT(*) as total FROM ${TABLES.USERS} u ${whereClause}`;
  const countRows = await query(countQuery, params);
  const total = countRows[0]?.total || 0;

  return {
    rows,
    total,
    page: parseInt(page),
    limit: parseInt(limit),
    pages: Math.ceil(total / limit),
    filters: {
      name,
      email,
      isVerified,
      role,
      startDate,
      endDate,
      search,
      hasLogins,
      lastLoginAfter,
      lastLoginBefore,
    },
    sort: {
      by: validSortBy,
      order: validSortOrder,
    },
  };
}

/**
 * Record user login
 */
export async function recordLogin(userId) {
  await query(`INSERT INTO ${TABLES.USER_LOGINS} (user_id) VALUES (?)`, [
    userId,
  ]);
}

/**
 * Count total users
 */
export async function countTotalUsers() {
  const rows = await query(`SELECT COUNT(*) as total FROM ${TABLES.USERS}`);
  return rows[0]?.total || 0;
}

/**
 * Count verified users
 */
export async function countVerifiedUsers() {
  const rows = await query(
    `SELECT COUNT(*) as total FROM ${TABLES.USERS} WHERE is_verified = ?`,
    [VERIFICATION_STATUS.VERIFIED]
  );
  return rows[0]?.total || 0;
}

/**
 * Get top users by login count
 */
export async function topUsersByLogin(limit = 3) {
  const rows = await query(
    `SELECT u.id, u.name, u.email, COUNT(l.id) as login_count
     FROM ${TABLES.USERS} u
     LEFT JOIN ${TABLES.USER_LOGINS} l ON l.user_id = u.id
     GROUP BY u.id
     ORDER BY login_count DESC
     LIMIT ${limit}`
  );
  return rows;
}

/**
 * Get inactive users
 */
export async function inactiveUsers({ hours = null, months = null } = {}) {
  let condition = "";

  if (hours !== null) {
    condition = `MAX(l.logged_in_at) < (NOW() - INTERVAL ${hours} HOUR) OR MAX(l.logged_in_at) IS NULL`;
  } else if (months !== null) {
    condition = `MAX(l.logged_in_at) < (NOW() - INTERVAL ${months} MONTH) OR MAX(l.logged_in_at) IS NULL`;
  } else {
    condition = `MAX(l.logged_in_at) < (NOW() - INTERVAL 1 HOUR) OR MAX(l.logged_in_at) IS NULL`;
  }

  const rows = await query(
    `SELECT u.id, u.name, u.email, MAX(l.logged_in_at) as last_login
     FROM ${TABLES.USERS} u
     LEFT JOIN ${TABLES.USER_LOGINS} l ON l.user_id = u.id
     GROUP BY u.id
     HAVING ${condition}`
  );
  return rows;
}

/**
 * Check if email exists
 */
export async function emailExists(email) {
  const rows = await query(`SELECT id FROM ${TABLES.USERS} WHERE email = ?`, [
    email,
  ]);
  return rows.length > 0;
}

/**
 * Get user statistics
 */
export async function getUserStatistics() {
  const [totalUsers, verifiedUsers, totalLogins] = await Promise.all([
    countTotalUsers(),
    countVerifiedUsers(),
    query(`SELECT COUNT(*) as total FROM ${TABLES.USER_LOGINS}`).then(
      (rows) => rows[0]?.total || 0
    ),
  ]);

  return {
    totalUsers,
    verifiedUsers,
    unverifiedUsers: totalUsers - verifiedUsers,
    totalLogins,
    verificationRate: totalUsers > 0 ? (verifiedUsers / totalUsers) * 100 : 0,
  };
}

/**
 * Get users by role
 */
export async function getUsersByRole(role) {
  const rows = await query(
    `SELECT id, name, email, role, is_verified, created_at, updated_at 
     FROM ${TABLES.USERS} WHERE role = ?`,
    [role]
  );
  return rows;
}

/**
 * Get recent users
 */
export async function getRecentUsers(days = 7) {
  const rows = await query(
    `SELECT id, name, email, role, is_verified, created_at, updated_at 
     FROM ${TABLES.USERS} 
     WHERE created_at >= DATE_SUB(NOW(), INTERVAL ${days} DAY)
     ORDER BY created_at DESC`
  );
  return rows;
}

/**
 * Search users
 */
export async function searchUsers({
  query: searchQuery,
  role,
  isVerified,
  limit = 10,
}) {
  let whereClause = "";
  let params = [];

  const conditions = [];

  if (searchQuery) {
    conditions.push("(name LIKE ? OR email LIKE ?)");
    params.push(`%${searchQuery}%`, `%${searchQuery}%`);
  }

  if (role) {
    conditions.push("role = ?");
    params.push(role);
  }

  if (isVerified !== undefined) {
    conditions.push("is_verified = ?");
    params.push(isVerified ? 1 : 0);
  }

  if (conditions.length > 0) {
    whereClause = "WHERE " + conditions.join(" AND ");
  }

  const rows = await query(
    `SELECT id, name, email, role, is_verified, created_at, updated_at 
     FROM ${TABLES.USERS} ${whereClause}
     ORDER BY created_at DESC
     LIMIT ${limit}`,
    params
  );

  return rows;
}

/**
 * Get registration statistics for a date range
 */
export async function getRegistrationStatistics({ startDate, endDate }) {
  const conditions = [];
  const params = [];

  if (startDate) {
    conditions.push("created_at >= ?");
    params.push(startDate);
  }

  if (endDate) {
    conditions.push("created_at <= ?");
    params.push(endDate);
  }

  const whereClause =
    conditions.length > 0 ? "WHERE " + conditions.join(" AND ") : "";

  // Get total users in date range
  const totalQuery = `SELECT COUNT(*) as total FROM ${TABLES.USERS} ${whereClause}`;
  const totalResult = await query(totalQuery, params);
  const totalInRange = totalResult[0]?.total || 0;

  // Get breakdown by verification status
  const breakdownQuery = `
    SELECT 
      SUM(CASE WHEN is_verified = ${VERIFICATION_STATUS.VERIFIED} THEN 1 ELSE 0 END) as verified,
      SUM(CASE WHEN is_verified = ${VERIFICATION_STATUS.UNVERIFIED} THEN 1 ELSE 0 END) as unverified
    FROM ${TABLES.USERS} ${whereClause}
  `;
  const breakdownResult = await query(breakdownQuery, params);
  const breakdown = {
    verified: breakdownResult[0]?.verified || 0,
    unverified: breakdownResult[0]?.unverified || 0,
  };

  // Get breakdown by role
  const roleBreakdownQuery = `
    SELECT 
      role,
      COUNT(*) as count
    FROM ${TABLES.USERS} ${whereClause}
    GROUP BY role
  `;
  const roleBreakdownResult = await query(roleBreakdownQuery, params);
  const byRole = {};
  roleBreakdownResult.forEach((row) => {
    byRole[row.role] = row.count;
  });

  // Get daily registration counts
  const dailyQuery = `
    SELECT 
      DATE(created_at) as date,
      COUNT(*) as count
    FROM ${TABLES.USERS} ${whereClause}
    GROUP BY DATE(created_at)
    ORDER BY DATE(created_at) ASC
  `;
  const dailyResult = await query(dailyQuery, params);

  return {
    totalInRange,
    startDate: startDate || null,
    endDate: endDate || null,
    breakdown,
    byRole,
    dailyRegistrations: dailyResult,
  };
}
