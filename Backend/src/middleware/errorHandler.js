import { HTTP_STATUS, ERROR_CODES } from "../enums/enums.js";

export function notFoundHandler(_req, res, _next) {
  res.status(HTTP_STATUS.NOT_FOUND).json({
    code: ERROR_CODES.NOT_FOUND,
    message: "Not Found",
  });
}

export function errorHandler(err, _req, res, _next) {
  const status = err.status || HTTP_STATUS.INTERNAL_SERVER_ERROR;
  const code = err.code || ERROR_CODES.INTERNAL_ERROR;
  const message = err.message || "Internal Server Error";
  if (process.env.NODE_ENV !== "test") {
    // eslint-disable-next-line no-console
    console.error(err);
  }
  res.status(status).json({ code, message });
}

export function createHttpError(
  status,
  message,
  code = ERROR_CODES.INTERNAL_ERROR
) {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  return error;
}
