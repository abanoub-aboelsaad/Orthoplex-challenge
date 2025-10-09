import { verifyJwt } from "../utils/jwtUtils.js";
import { createHttpError } from "./errorHandler.js";
import { USER_ROLES, ERROR_CODES } from "../enums/enums.js";

export function requireAuth(req, _res, next) {
  const authHeader = req.headers["authorization"] || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token)
    return next(
      createHttpError(401, "Missing token", ERROR_CODES.UNAUTHORIZED)
    );
  try {
    const payload = verifyJwt(token);
    req.user = payload; // { id, role, email }
    next();
  } catch {
    return next(
      createHttpError(401, "Invalid or expired token", ERROR_CODES.UNAUTHORIZED)
    );
  }
}

export function requireAdmin(req, _res, next) {
  if (!req.user)
    return next(createHttpError(401, "Unauthorized", ERROR_CODES.UNAUTHORIZED));
  if (req.user.role !== USER_ROLES.ADMIN)
    return next(createHttpError(403, "Forbidden", ERROR_CODES.FORBIDDEN));
  next();
}

export function requireSelfOrAdmin(req, _res, next) {
  if (!req.user)
    return next(createHttpError(401, "Unauthorized", ERROR_CODES.UNAUTHORIZED));
  const isAdmin = req.user.role === USER_ROLES.ADMIN;
  const isSelf = String(req.user.id) === String(req.params.id);
  if (!isAdmin && !isSelf)
    return next(createHttpError(403, "Forbidden", ERROR_CODES.FORBIDDEN));
  next();
}
