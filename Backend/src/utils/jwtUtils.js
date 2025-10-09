import jwt from "jsonwebtoken";
import { jwtConfig } from "../config/jwt.js";

export function signJwt(payload, options = {}) {
  return jwt.sign(payload, jwtConfig.secret, {
    expiresIn: jwtConfig.expiresIn,
    ...options,
  });
}

export function verifyJwt(token) {
  try {
    return jwt.verify(token, jwtConfig.secret);
  } catch {
    return null;
  }
}

export function decodeJwt(token) {
  return jwt.decode(token);
}