import xss from "xss";
import validator from "validator";
import { SANITIZATION, INPUT_TYPES } from "../enums/enums.js";

/**
 * Sanitize a string value by removing XSS and trimming
 * @param {string} value - The string to sanitize
 * @param {number} maxLength - Maximum allowed length
 * @returns {string} Sanitized string
 */
export function sanitizeString(
  value,
  maxLength = SANITIZATION.MAX_STRING_LENGTH
) {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  const sanitized = xss(trimmed, {
    whiteList: {},
    stripIgnoreTag: true,
    stripIgnoreTagBody: ["script"],
  });
  return sanitized.length > maxLength
    ? sanitized.substring(0, maxLength)
    : sanitized;
}

/**
 * Sanitize email input
 * @param {string} email - Email to sanitize
 * @returns {string} Sanitized email
 */
export function sanitizeEmail(email) {
  if (typeof email !== "string") return email;
  const trimmed = email.trim().toLowerCase();
  const sanitized = xss(trimmed, {
    whiteList: {},
    stripIgnoreTag: true,
  });
  return sanitized.length > SANITIZATION.MAX_EMAIL_LENGTH
    ? sanitized.substring(0, SANITIZATION.MAX_EMAIL_LENGTH)
    : sanitized;
}

/**
 * Sanitize name input
 * @param {string} name - Name to sanitize
 * @returns {string} Sanitized name
 */
export function sanitizeName(name) {
  if (typeof name !== "string") return name;
  const trimmed = name.trim();
  const sanitized = xss(trimmed, {
    whiteList: {},
    stripIgnoreTag: true,
  });
  return sanitized.length > SANITIZATION.MAX_NAME_LENGTH
    ? sanitized.substring(0, SANITIZATION.MAX_NAME_LENGTH)
    : sanitized;
}

/**
 * Sanitize password input
 * @param {string} password - Password to sanitize
 * @returns {string} Sanitized password
 */
export function sanitizePassword(password) {
  if (typeof password !== "string") return password;
  const trimmed = password.trim();
  const sanitized = xss(trimmed, {
    whiteList: {},
    stripIgnoreTag: true,
  });
  return sanitized.length > SANITIZATION.MAX_PASSWORD_LENGTH
    ? sanitized.substring(0, SANITIZATION.MAX_PASSWORD_LENGTH)
    : sanitized;
}

/**
 * Sanitize URL input
 * @param {string} url - URL to sanitize
 * @returns {string} Sanitized URL
 */
export function sanitizeUrl(url) {
  if (typeof url !== "string") return url;
  const trimmed = url.trim();
  const sanitized = xss(trimmed, {
    whiteList: {},
    stripIgnoreTag: true,
  });
  return sanitized;
}

/**
 * Sanitize number input
 * @param {any} value - Value to sanitize
 * @returns {number|null} Sanitized number or null
 */
export function sanitizeNumber(value) {
  if (value === null || value === undefined) return null;
  const num = Number(value);
  return isNaN(num) ? null : num;
}

/**
 * Sanitize boolean input
 * @param {any} value - Value to sanitize
 * @returns {boolean} Sanitized boolean
 */
export function sanitizeBoolean(value) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const lower = value.toLowerCase();
    return lower === "true" || lower === "1" || lower === "yes";
  }
  return Boolean(value);
}

/**
 * Sanitize date input
 * @param {any} value - Value to sanitize
 * @returns {Date|null} Sanitized date or null
 */
export function sanitizeDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return isNaN(date.getTime()) ? null : date;
}

/**
 * Sanitize JSON input
 * @param {any} value - Value to sanitize
 * @returns {any} Sanitized JSON
 */
export function sanitizeJson(value) {
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }
  return value;
}

/**
 * Sanitize user input with type-specific sanitization
 * @param {object} input - Input object to sanitize
 * @returns {object} Sanitized input object
 */
export function sanitizeUserInput(input) {
  const sanitized = { ...input };

  if (sanitized.name !== undefined) {
    sanitized.name = sanitizeName(sanitized.name);
  }

  if (sanitized.email !== undefined) {
    sanitized.email = sanitizeEmail(sanitized.email);
  }

  if (sanitized.password !== undefined) {
    sanitized.password = sanitizePassword(sanitized.password);
  }

  return sanitized;
}

/**
 * Sanitize input based on type
 * @param {any} value - Value to sanitize
 * @param {string} type - Type of input (from INPUT_TYPES enum)
 * @returns {any} Sanitized value
 */
export function sanitizeByType(value, type) {
  switch (type) {
    case INPUT_TYPES.STRING:
      return sanitizeString(value);
    case INPUT_TYPES.EMAIL:
      return sanitizeEmail(value);
    case INPUT_TYPES.PASSWORD:
      return sanitizePassword(value);
    case INPUT_TYPES.NAME:
      return sanitizeName(value);
    case INPUT_TYPES.URL:
      return sanitizeUrl(value);
    case INPUT_TYPES.NUMBER:
      return sanitizeNumber(value);
    case INPUT_TYPES.BOOLEAN:
      return sanitizeBoolean(value);
    case INPUT_TYPES.DATE:
      return sanitizeDate(value);
    case INPUT_TYPES.JSON:
      return sanitizeJson(value);
    default:
      return sanitizeString(value);
  }
}

/**
 * Sanitize object with field-specific types
 * @param {object} obj - Object to sanitize
 * @param {object} fieldTypes - Object mapping field names to types
 * @returns {object} Sanitized object
 */
export function sanitizeObject(obj, fieldTypes = {}) {
  const sanitized = {};

  for (const [key, value] of Object.entries(obj)) {
    const type = fieldTypes[key] || INPUT_TYPES.STRING;
    sanitized[key] = sanitizeByType(value, type);
  }

  return sanitized;
}

/**
 * Validate and sanitize email
 * @param {string} email - Email to validate and sanitize
 * @returns {object} Validation result
 */
export function validateAndSanitizeEmail(email) {
  const sanitized = sanitizeEmail(email);
  const isValid = validator.isEmail(sanitized);

  return {
    value: sanitized,
    isValid,
    error: isValid ? null : "Invalid email format",
  };
}

/**
 * Validate and sanitize password
 * @param {string} password - Password to validate and sanitize
 * @returns {object} Validation result
 */
export function validateAndSanitizePassword(password) {
  const sanitized = sanitizePassword(password);
  const isValid =
    sanitized.length >= SANITIZATION.MIN_PASSWORD_LENGTH &&
    sanitized.length <= SANITIZATION.MAX_PASSWORD_LENGTH;

  return {
    value: sanitized,
    isValid,
    error: isValid
      ? null
      : `Password must be between ${SANITIZATION.MIN_PASSWORD_LENGTH} and ${SANITIZATION.MAX_PASSWORD_LENGTH} characters`,
  };
}
