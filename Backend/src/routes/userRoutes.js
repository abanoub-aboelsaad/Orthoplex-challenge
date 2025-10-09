import { Router } from "express";
import {
  requireAuth,
  requireAdmin,
  requireSelfOrAdmin,
} from "../middleware/auth.js";
import { validateBody, validateQuery } from "../middleware/validator.js";
import {
  sanitizeUserUpdate,
  sanitizePagination,
  sanitizeSearch,
  sanitizeFieldsByType,
} from "../middleware/sanitization.js";
import { userUpdateSchema, listUsersQuerySchema } from "../utils/validation.js";
import { INPUT_TYPES } from "../enums/enums.js";
import {
  getById,
  updateById,
  deleteById,
  list,
  totals,
  topLogins,
  inactive,
  checkEmail,
  statistics,
  usersByRole,
  recentUsers,
  search,
  registrationStats,
} from "../controllers/userController.js";

const router = Router();

// List users with filters, pagination, date range - admin only
router.get(
  "/",
  requireAuth,
  requireAdmin,
  sanitizePagination(),
  sanitizeSearch(),
  validateQuery(listUsersQuerySchema),
  list
);

// Totals - admin only
router.get("/totals", requireAuth, requireAdmin, totals);

// Top users by login - admin only
router.get(
  "/analytics/top-logins",
  requireAuth,
  requireAdmin,
  sanitizeFieldsByType({ limit: INPUT_TYPES.NUMBER }),
  topLogins
);

// Inactive users - admin only (query: hours or months)
router.get(
  "/analytics/inactive",
  requireAuth,
  requireAdmin,
  sanitizeFieldsByType({
    hours: INPUT_TYPES.NUMBER,
    months: INPUT_TYPES.NUMBER,
  }),
  inactive
);

// User statistics - admin only
router.get("/analytics/statistics", requireAuth, requireAdmin, statistics);

// Registration statistics by date range - admin only
router.get(
  "/analytics/registration-stats",
  requireAuth,
  requireAdmin,
  sanitizeFieldsByType({
    startDate: INPUT_TYPES.DATE,
    endDate: INPUT_TYPES.DATE,
  }),
  registrationStats
);

// Users by role - admin only
router.get("/role/:role", requireAuth, requireAdmin, usersByRole);

// Recent users - admin only
router.get(
  "/analytics/recent",
  requireAuth,
  requireAdmin,
  sanitizeFieldsByType({ days: INPUT_TYPES.NUMBER }),
  recentUsers
);

// Search users - admin only
router.get("/search", requireAuth, requireAdmin, sanitizeSearch(), search);

// Check if email exists - public endpoint
router.get("/check-email", checkEmail);

// CRUD on specific user - protected (user can read self, admin can read anyone)
router.get("/:id", requireAuth, requireSelfOrAdmin, getById);
router.put(
  "/:id",
  requireAuth,
  requireSelfOrAdmin,
  sanitizeUserUpdate(),
  validateBody(userUpdateSchema),
  updateById
);
router.patch(
  "/:id",
  requireAuth,
  requireSelfOrAdmin,
  sanitizeUserUpdate(),
  validateBody(userUpdateSchema),
  updateById
);
router.delete("/:id", requireAuth, requireAdmin, deleteById);

export default router;
