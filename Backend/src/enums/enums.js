// User Roles
export const USER_ROLES = {
  USER: "user",
  ADMIN: "admin",
};

// User Verification Status
export const VERIFICATION_STATUS = {
  UNVERIFIED: 0,
  VERIFIED: 1,
};

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
};

// Error Codes
export const ERROR_CODES = {
  EMAIL_TAKEN: "EMAIL_TAKEN",
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  NOT_VERIFIED: "NOT_VERIFIED",
  NOT_FOUND: "NOT_FOUND",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  INTERNAL_ERROR: "INTERNAL_ERROR",
};

// API Response Messages
export const API_MESSAGES = {
  USER_CREATED: "User created successfully",
  USER_UPDATED: "User updated successfully",
  USER_DELETED: "User deleted successfully",
  USER_VERIFIED: "User verified successfully",
  LOGIN_SUCCESS: "Login successful",
  INVALID_CREDENTIALS: "Invalid credentials",
  EMAIL_ALREADY_EXISTS: "Email already in use",
  USER_NOT_VERIFIED: "User not verified",
  USER_NOT_FOUND: "User not found",
  UNAUTHORIZED_ACCESS: "Unauthorized access",
  FORBIDDEN_ACCESS: "Forbidden access",
  VALIDATION_FAILED: "Validation failed",
  INTERNAL_SERVER_ERROR: "Internal server error",
};

// Pagination Defaults
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
};

// User Analytics Time Periods
export const TIME_PERIODS = {
  HOURS: "hours",
  MONTHS: "months",
};

// Database Table Names
export const TABLES = {
  USERS: "users",
  USER_LOGINS: "user_logins",
};

// JWT Token Configuration
export const JWT_CONFIG = {
  DEFAULT_EXPIRES_IN: "24h",
  REFRESH_EXPIRES_IN: "7d",
};

// Sanitization Configuration
export const SANITIZATION = {
  MAX_STRING_LENGTH: 1000,
  MAX_EMAIL_LENGTH: 255,
  MAX_NAME_LENGTH: 100,
  MAX_PASSWORD_LENGTH: 128,
  MIN_PASSWORD_LENGTH: 8,
  ALLOWED_HTML_TAGS: [],
  FORBIDDEN_HTML_TAGS: ["script", "iframe", "object", "embed", "form"],
};

// Input Types for Sanitization
export const INPUT_TYPES = {
  STRING: "string",
  EMAIL: "email",
  PASSWORD: "password",
  NAME: "name",
  URL: "url",
  NUMBER: "number",
  BOOLEAN: "boolean",
  DATE: "date",
  JSON: "json",
};
