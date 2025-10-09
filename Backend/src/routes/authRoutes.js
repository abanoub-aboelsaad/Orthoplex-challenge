import { Router } from "express";
import { register, login, verify } from "../controllers/authController.js";
import { validateBody } from "../middleware/validator.js";
import {
  sanitizeRegistration,
  sanitizeLogin,
  validateAndSanitizeEmails,
  validateAndSanitizePasswords,
} from "../middleware/sanitization.js";
import {
  registerSchema,
  loginSchema,
  verifySchema,
} from "../utils/validation.js";

const router = Router();

router.post(
  "/register",
  sanitizeRegistration(),
  validateAndSanitizeEmails(["email"]),
  validateAndSanitizePasswords(["password"]),
  validateBody(registerSchema),
  register
);
router.post(
  "/login",
  sanitizeLogin(),
  validateAndSanitizeEmails(["email"]),
  validateAndSanitizePasswords(["password"]),
  validateBody(loginSchema),
  login
);
router.post(
  "/verify",
  validateAndSanitizeEmails(["email"]),
  validateBody(verifySchema),
  verify
);

export default router;
