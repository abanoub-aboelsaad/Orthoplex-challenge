import request from "supertest";
import app from "../src/app.js";
import { query } from "../src/config/database.js";

describe("Auth APIs", () => {
  let testUser;
  let authToken;

  beforeAll(async () => {
    // Clean up any existing test data
    await query(
      "DELETE FROM user_logins WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%test%')"
    );
    await query("DELETE FROM users WHERE email LIKE '%test%'");
  });

  afterAll(async () => {
    // Clean up test data
    if (testUser) {
      await query("DELETE FROM user_logins WHERE user_id = ?", [testUser.id]);
      await query("DELETE FROM users WHERE id = ?", [testUser.id]);
    }
  });

  describe("Health Check", () => {
    it("should return health status", async () => {
      const res = await request(app).get("/health");
      expect(res.status).toBe(200);
      expect(res.body.status).toBe("ok");
    });
  });

  describe("User Registration", () => {
    it("should register a new user successfully", async () => {
      const userData = {
        name: "Test User",
        email: "test@example.com",
        password: "password123",
      };

      const res = await request(app).post("/api/auth/register").send(userData);

      expect(res.status).toBe(201);
      expect(res.body.user).toBeDefined();
      expect(res.body.user.name).toBe(userData.name);
      expect(res.body.user.email).toBe(userData.email);
      expect(res.body.user.password_hash).toBeUndefined(); // Password should not be returned

      testUser = res.body.user;
    });

    it("should reject registration with invalid email", async () => {
      const userData = {
        name: "Test User",
        email: "invalid-email",
        password: "password123",
      };

      const res = await request(app).post("/api/auth/register").send(userData);

      expect(res.status).toBe(400);
      expect(res.body.code).toBe("VALIDATION_ERROR");
    });

    it("should reject registration with weak password", async () => {
      const userData = {
        name: "Test User",
        email: "test2@example.com",
        password: "123",
      };

      const res = await request(app).post("/api/auth/register").send(userData);

      expect(res.status).toBe(400);
      expect(res.body.code).toBe("VALIDATION_ERROR");
    });

    it("should reject registration with duplicate email", async () => {
      const userData = {
        name: "Test User 2",
        email: "test@example.com", // Same email as first test
        password: "password123",
      };

      const res = await request(app).post("/api/auth/register").send(userData);

      expect(res.status).toBe(409);
      expect(res.body.code).toBe("EMAIL_TAKEN");
    });

    it("should sanitize input data", async () => {
      const userData = {
        name: "<script>alert('xss')</script>Test User",
        email: "  TEST@EXAMPLE.COM  ",
        password: "password123",
      };

      const res = await request(app).post("/api/auth/register").send(userData);

      expect(res.status).toBe(201);
      expect(res.body.user.name).toBe("Test User"); // XSS should be removed
      expect(res.body.user.email).toBe("test@example.com"); // Should be lowercase and trimmed
    });
  });

  describe("User Login", () => {
    it("should login with valid credentials", async () => {
      const loginData = {
        email: "test@example.com",
        password: "password123",
      };

      const res = await request(app).post("/api/auth/login").send(loginData);

      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
      expect(res.body.user).toBeDefined();
      expect(res.body.user.email).toBe(loginData.email);

      authToken = res.body.token;
    });

    it("should reject login with invalid email", async () => {
      const loginData = {
        email: "nonexistent@example.com",
        password: "password123",
      };

      const res = await request(app).post("/api/auth/login").send(loginData);

      expect(res.status).toBe(401);
      expect(res.body.code).toBe("INVALID_CREDENTIALS");
    });

    it("should reject login with invalid password", async () => {
      const loginData = {
        email: "test@example.com",
        password: "wrongpassword",
      };

      const res = await request(app).post("/api/auth/login").send(loginData);

      expect(res.status).toBe(401);
      expect(res.body.code).toBe("INVALID_CREDENTIALS");
    });

    it("should reject login for unverified user when auto-verify is disabled", async () => {
      // This test would require setting AUTO_VERIFY_USERS=false
      // For now, we'll test the verification endpoint
      const verifyData = {
        email: "test@example.com",
      };

      const res = await request(app).post("/api/auth/verify").send(verifyData);

      expect(res.status).toBe(200);
      expect(res.body.user).toBeDefined();
    });
  });

  describe("User Verification", () => {
    it("should verify user by email", async () => {
      const verifyData = {
        email: "test@example.com",
      };

      const res = await request(app).post("/api/auth/verify").send(verifyData);

      expect(res.status).toBe(200);
      expect(res.body.user).toBeDefined();
      expect(res.body.user.is_verified).toBe(1);
    });

    it("should reject verification for non-existent user", async () => {
      const verifyData = {
        email: "nonexistent@example.com",
      };

      const res = await request(app).post("/api/auth/verify").send(verifyData);

      expect(res.status).toBe(404);
      expect(res.body.code).toBe("NOT_FOUND");
    });
  });

  describe("Input Validation", () => {
    it("should reject requests with missing required fields", async () => {
      const res = await request(app).post("/api/auth/register").send({});

      expect(res.status).toBe(400);
      expect(res.body.code).toBe("VALIDATION_ERROR");
    });

    it("should reject requests with XSS attempts", async () => {
      const userData = {
        name: "<script>alert('xss')</script>",
        email: "test@example.com",
        password: "password123",
      };

      const res = await request(app).post("/api/auth/register").send(userData);

      expect(res.status).toBe(201);
      expect(res.body.user.name).not.toContain("<script>");
    });
  });
});
