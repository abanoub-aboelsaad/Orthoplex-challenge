import { createHttpError } from "./errorHandler.js";
import { ERROR_CODES, HTTP_STATUS } from "../enums/enums.js";
import {
  sanitizeObject,
  sanitizeString,
  sanitizeNumber,
  sanitizeBoolean,
  sanitizeDate,
} from "../utils/sanitization.js";

/**
 * Generic sanitization middleware factory
 * @param {string} source
 * @param {object} fieldTypes
 * @param {string} errorMessage
 * @returns {function}
 */
function createSanitizer(source, fieldTypes = {}, errorMessage = null) {
  return (req, _res, next) => {
    try {
      if (!req[source] || typeof req[source] !== "object") {
        return next();
      }

      const sanitized = sanitizeObject(req[source], fieldTypes);

      // For query params, modify in place instead of reassigning
      if (source === "query") {
        Object.keys(req[source]).forEach((key) => delete req[source][key]);
        Object.assign(req[source], sanitized);
      } else {
        req[source] = sanitized;
      }

      next();
    } catch (error) {
      next(
        createHttpError(
          HTTP_STATUS.BAD_REQUEST,
          errorMessage || `Invalid ${source}`,
          ERROR_CODES.VALIDATION_ERROR
        )
      );
    }
  };
}

/**
 * Helper to sanitize specific fields
 * @param {object} data
 * @param {object} fieldConfig
 */
function sanitizeFields(data, fieldConfig) {
  Object.entries(fieldConfig).forEach(([field, sanitizeFn]) => {
    if (data[field] !== undefined) {
      data[field] = sanitizeFn(data[field]);
    }
  });
}

export const sanitizeBody = (fieldTypes = {}) =>
  createSanitizer("body", fieldTypes, "Invalid request body");

export const sanitizeQuery = (fieldTypes = {}) =>
  createSanitizer("query", fieldTypes, "Invalid query parameters");

export const sanitizeParams = (fieldTypes = {}) =>
  createSanitizer("params", fieldTypes, "Invalid request parameters");

export function sanitizePagination() {
  return (req, _res, next) => {
    try {
      const { query } = req;

      const paginationFields = {
        page: (val) => sanitizeNumber(val) || 1,
        limit: (val) => sanitizeNumber(val) || 10,
      };

      const dateFields = {
        startDate: sanitizeDate,
        endDate: sanitizeDate,
        lastLoginAfter: sanitizeDate,
        lastLoginBefore: sanitizeDate,
      };

      const booleanFields = {
        isVerified: sanitizeBoolean,
        hasLogins: sanitizeBoolean,
      };

      const stringFields = {
        search: sanitizeString,
        sortBy: sanitizeString,
        sortOrder: (val) => sanitizeString(val).toUpperCase(),
      };

      // Apply sanitization
      sanitizeFields(query, {
        ...paginationFields,
        ...dateFields,
        ...booleanFields,
        ...stringFields,
      });

      next();
    } catch (error) {
      next(
        createHttpError(
          HTTP_STATUS.BAD_REQUEST,
          "Invalid pagination parameters",
          ERROR_CODES.VALIDATION_ERROR
        )
      );
    }
  };
}

/**
 * Sanitize search parameters
 */
export function sanitizeSearch() {
  return (req, _res, next) => {
    try {
      sanitizeFields(req.query, {
        name: sanitizeString,
        email: sanitizeString,
      });
      next();
    } catch (error) {
      next(
        createHttpError(
          HTTP_STATUS.BAD_REQUEST,
          "Invalid search parameters",
          ERROR_CODES.VALIDATION_ERROR
        )
      );
    }
  };
}

export function sanitizeRegistration() {
  return (req, _res, next) => {
    try {
      if (!req.body) return next();

      sanitizeFields(req.body, {
        name: sanitizeString,
        email: sanitizeString,
        password: sanitizeString,
      });

      next();
    } catch (error) {
      next(
        createHttpError(
          HTTP_STATUS.BAD_REQUEST,
          "Invalid registration data",
          ERROR_CODES.VALIDATION_ERROR
        )
      );
    }
  };
}

export function sanitizeLogin() {
  return (req, _res, next) => {
    try {
      if (!req.body) return next();

      sanitizeFields(req.body, {
        email: sanitizeString,
        password: sanitizeString,
      });

      next();
    } catch (error) {
      next(
        createHttpError(
          HTTP_STATUS.BAD_REQUEST,
          "Invalid login data",
          ERROR_CODES.VALIDATION_ERROR
        )
      );
    }
  };
}

export function sanitizeUserUpdate() {
  return (req, _res, next) => {
    try {
      if (!req.body) return next();

      sanitizeFields(req.body, {
        name: sanitizeString,
        email: sanitizeString,
      });

      next();
    } catch (error) {
      next(
        createHttpError(
          HTTP_STATUS.BAD_REQUEST,
          "Invalid user data",
          ERROR_CODES.VALIDATION_ERROR
        )
      );
    }
  };
}

/**
 * Sanitize specific fields based on input types
 * @param {object} fieldTypes - Object mapping field names to input types
 * @returns {function} Express middleware
 */
export function sanitizeFieldsByType(fieldTypes = {}) {
  return (req, _res, next) => {
    try {
      const { query, body, params } = req;

      Object.entries(fieldTypes).forEach(([field, type]) => {
        // Check query params first
        if (query && query[field] !== undefined) {
          query[field] = sanitizeByType(query[field], type);
        }
        // Then body
        if (body && body[field] !== undefined) {
          body[field] = sanitizeByType(body[field], type);
        }
        // Then params
        if (params && params[field] !== undefined) {
          params[field] = sanitizeByType(params[field], type);
        }
      });

      next();
    } catch (error) {
      next(
        createHttpError(
          HTTP_STATUS.BAD_REQUEST,
          "Invalid input data",
          ERROR_CODES.VALIDATION_ERROR
        )
      );
    }
  };
}

/**
 * Sanitize value based on type
 * @param {any} value - Value to sanitize
 * @param {string} type - Type from INPUT_TYPES enum
 * @returns {any} Sanitized value
 */
function sanitizeByType(value, type) {
  switch (type) {
    case "NUMBER":
      return sanitizeNumber(value);
    case "STRING":
      return sanitizeString(value);
    case "BOOLEAN":
      return sanitizeBoolean(value);
    case "DATE":
      return sanitizeDate(value);
    default:
      return value;
  }
}

/**
 * Validate and sanitize email fields
 * @param {string[]} fieldNames - Array of field names to sanitize as emails
 * @returns {function} Express middleware
 */
export function validateAndSanitizeEmails(fieldNames = []) {
  return (req, _res, next) => {
    try {
      const { body, query } = req;

      fieldNames.forEach((field) => {
        if (body && body[field]) {
          body[field] = sanitizeString(body[field]).toLowerCase().trim();
        }
        if (query && query[field]) {
          query[field] = sanitizeString(query[field]).toLowerCase().trim();
        }
      });

      next();
    } catch (error) {
      next(
        createHttpError(
          HTTP_STATUS.BAD_REQUEST,
          "Invalid email format",
          ERROR_CODES.VALIDATION_ERROR
        )
      );
    }
  };
}

/**
 * Validate and sanitize password fields
 * @param {string[]} fieldNames - Array of field names to sanitize as passwords
 * @returns {function} Express middleware
 */
export function validateAndSanitizePasswords(fieldNames = []) {
  return (req, _res, next) => {
    try {
      const { body } = req;

      fieldNames.forEach((field) => {
        if (body && body[field]) {
          // Trim whitespace but preserve the password content
          body[field] = body[field].trim();
        }
      });

      next();
    } catch (error) {
      next(
        createHttpError(
          HTTP_STATUS.BAD_REQUEST,
          "Invalid password format",
          ERROR_CODES.VALIDATION_ERROR
        )
      );
    }
  };
}
