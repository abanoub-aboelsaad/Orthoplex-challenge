import { createHttpError } from "./errorHandler.js";
import { ERROR_CODES } from "../enums/enums.js";

export function validateBody(schema) {
  return (req, _res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });
    if (error)
      return next(
        createHttpError(400, error.message, ERROR_CODES.VALIDATION_ERROR)
      );
    req.body = value;
    next();
  };
}

export function validateQuery(schema) {
  return (req, _res, next) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true,
    });
    if (error)
      return next(
        createHttpError(400, error.message, ERROR_CODES.VALIDATION_ERROR)
      );
    // Modify properties in place instead of reassigning
    Object.keys(req.query).forEach((key) => delete req.query[key]);
    Object.assign(req.query, value);
    next();
  };
}
