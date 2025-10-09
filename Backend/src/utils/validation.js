import Joi from "joi";
import { USER_ROLES, PAGINATION } from "../enums/enums.js";

export const registerSchema = Joi.object({
  name: Joi.string().min(2).max(100).trim().required(),
  email: Joi.string().email().lowercase().trim().required(),
  password: Joi.string().min(8).max(128).required(),
  role: Joi.string()
    .valid(...Object.values(USER_ROLES))
    .default(USER_ROLES.USER),
});

export const loginSchema = Joi.object({
  email: Joi.string().email().lowercase().trim().required(),
  password: Joi.string().min(8).max(128).required(),
});

export const verifySchema = Joi.object({
  email: Joi.string().email().lowercase().trim().required(),
});

export const userUpdateSchema = Joi.object({
  name: Joi.string().min(2).max(100).trim(),
  email: Joi.string().email().lowercase().trim(),
}).min(1);

export const roleSchema = Joi.string()
  .valid(...Object.values(USER_ROLES))
  .required();

export const listUsersQuerySchema = Joi.object({
  // Basic filters
  name: Joi.string().trim().optional(),
  email: Joi.string().email().lowercase().trim().optional(),
  isVerified: Joi.boolean().optional(),
  role: Joi.string().valid("user", "admin").optional(),

  // Date range filters
  startDate: Joi.date().optional(),
  endDate: Joi.date().optional(),

  // Advanced search
  search: Joi.string().trim().optional(),

  // Login-based filters
  hasLogins: Joi.boolean().optional(),
  lastLoginAfter: Joi.date().optional(),
  lastLoginBefore: Joi.date().optional(),

  // Pagination
  page: Joi.number().integer().min(1).default(PAGINATION.DEFAULT_PAGE),
  limit: Joi.number()
    .integer()
    .min(1)
    .max(PAGINATION.MAX_LIMIT)
    .default(PAGINATION.DEFAULT_LIMIT),

  // Sorting
  sortBy: Joi.string()
    .valid(
      "id",
      "name",
      "email",
      "role",
      "is_verified",
      "created_at",
      "updated_at"
    )
    .default("created_at"),
  sortOrder: Joi.string().valid("ASC", "DESC").default("DESC"),
});
