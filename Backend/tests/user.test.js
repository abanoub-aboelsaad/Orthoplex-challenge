import request from "supertest";
import app from "../src/app.js";
import { query } from "../src/config/database.js";

describe("Users APIs", () => {
  let adminToken;
  let userToken;
  let testUsers = [];
  let adminUser;

  beforeAll(async () => {
    // Clean up test data
    await query(
      "DELETE FROM user_logins WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%test%')"
    );
    await query("DELETE FROM users WHERE email LIKE '%test%'");

    // Create test admin user
    const adminData = {
      name: "Test Admin",
      email: "admin@test.com",
      password: "password123",
      role: "admin",
    };

    const adminRes = await request(app)
      .post("/api/auth/register")
      .send(adminData);

    adminUser = adminRes.body.user;
    adminToken = (
      await request(app)
        .post("/api/auth/login")
        .send({ email: adminData.email, password: adminData.password })
    ).body.token;

    // Create test regular user
    const userData = {
      name: "Test User",
      email: "user@test.com",
      password: "password123",
    };

    const userRes = await request(app)
      .post("/api/auth/register")
      .send(userData);

    testUsers.push(userRes.body.user);
    userToken = (
      await request(app)
        .post("/api/auth/login")
        .send({ email: userData.email, password: userData.password })
    ).body.token;

    // Create additional test users for filtering tests
    const additionalUsers = [
      { name: "John Doe", email: "john@test.com", password: "password123" },
      { name: "Jane Smith", email: "jane@test.com", password: "password123" },
      { name: "Bob Wilson", email: "bob@test.com", password: "password123" },
    ];

    for (const userData of additionalUsers) {
      const res = await request(app).post("/api/auth/register").send(userData);
      testUsers.push(res.body.user);
    }
  });

  afterAll(async () => {
    // Clean up test data
    const userIds = [adminUser.id, ...testUsers.map((u) => u.id)];
    await query("DELETE FROM user_logins WHERE user_id IN (?)", [userIds]);
    await query("DELETE FROM users WHERE id IN (?)", [userIds]);
  });

  describe("Authentication Requirements", () => {
    it("should require authentication for listing users", async () => {
      const res = await request(app).get("/api/users");
      expect(res.status).toBe(401);
      expect(res.body.code).toBe("UNAUTHORIZED");
    });

    it("should require authentication for getting user details", async () => {
      const res = await request(app).get("/api/users/1");
      expect(res.status).toBe(401);
      expect(res.body.code).toBe("UNAUTHORIZED");
    });

    it("should require authentication for updating users", async () => {
      const res = await request(app)
        .put("/api/users/1")
        .send({ name: "Updated" });
      expect(res.status).toBe(401);
      expect(res.body.code).toBe("UNAUTHORIZED");
    });

    it("should require authentication for deleting users", async () => {
      const res = await request(app).delete("/api/users/1");
      expect(res.status).toBe(401);
      expect(res.body.code).toBe("UNAUTHORIZED");
    });
  });

  describe("Authorization", () => {
    it("should allow admin to list all users", async () => {
      const res = await request(app)
        .get("/api/users")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.rows).toBeDefined();
      expect(Array.isArray(res.body.rows)).toBe(true);
    });

    it("should reject regular user from listing all users", async () => {
      const res = await request(app)
        .get("/api/users")
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.status).toBe(403);
      expect(res.body.code).toBe("FORBIDDEN");
    });

    it("should allow users to get their own details", async () => {
      const res = await request(app)
        .get(`/api/users/${testUsers[0].id}`)
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.user).toBeDefined();
      expect(res.body.user.id).toBe(testUsers[0].id);
    });

    it("should allow admin to get any user details", async () => {
      const res = await request(app)
        .get(`/api/users/${testUsers[0].id}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.user).toBeDefined();
    });

    it("should reject user from getting other user details", async () => {
      const res = await request(app)
        .get(`/api/users/${testUsers[1].id}`)
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.status).toBe(403);
      expect(res.body.code).toBe("FORBIDDEN");
    });
  });

  describe("User CRUD Operations", () => {
    it("should get user details by ID", async () => {
      const res = await request(app)
        .get(`/api/users/${testUsers[0].id}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.user).toBeDefined();
      expect(res.body.user.id).toBe(testUsers[0].id);
      expect(res.body.user.name).toBe(testUsers[0].name);
      expect(res.body.user.email).toBe(testUsers[0].email);
    });

    it("should update user details", async () => {
      const updateData = {
        name: "Updated Test User",
        email: "updated@test.com",
      };

      const res = await request(app)
        .put(`/api/users/${testUsers[0].id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send(updateData);

      expect(res.status).toBe(200);
      expect(res.body.user.name).toBe(updateData.name);
      expect(res.body.user.email).toBe(updateData.email);
    });

    it("should reject update with duplicate email", async () => {
      const updateData = {
        email: testUsers[1].email, // Use another user's email
      };

      const res = await request(app)
        .put(`/api/users/${testUsers[0].id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send(updateData);

      expect(res.status).toBe(409);
      expect(res.body.code).toBe("EMAIL_TAKEN");
    });

    it("should delete user", async () => {
      // Create a user to delete
      const userToDelete = {
        name: "Delete Me",
        email: "delete@test.com",
        password: "password123",
      };

      const createRes = await request(app)
        .post("/api/auth/register")
        .send(userToDelete);

      const deleteRes = await request(app)
        .delete(`/api/users/${createRes.body.user.id}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(deleteRes.status).toBe(204);

      // Verify user is deleted
      const getRes = await request(app)
        .get(`/api/users/${createRes.body.user.id}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(getRes.status).toBe(404);
    });
  });

  describe("Advanced Filtering and Pagination", () => {
    it("should filter users by name", async () => {
      const res = await request(app)
        .get("/api/users?name=John")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.rows).toBeDefined();
      expect(res.body.rows.every((user) => user.name.includes("John"))).toBe(
        true
      );
    });

    it("should filter users by email", async () => {
      const res = await request(app)
        .get("/api/users?email=jane@test.com")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.rows).toBeDefined();
      expect(res.body.rows.length).toBeGreaterThan(0);
      expect(res.body.rows[0].email).toBe("jane@test.com");
    });

    it("should filter users by verification status", async () => {
      const res = await request(app)
        .get("/api/users?isVerified=true")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.rows).toBeDefined();
      expect(res.body.rows.every((user) => user.is_verified === 1)).toBe(true);
    });

    it("should filter users by role", async () => {
      const res = await request(app)
        .get("/api/users?role=user")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.rows).toBeDefined();
      expect(res.body.rows.every((user) => user.role === "user")).toBe(true);
    });

    it("should search users with general search term", async () => {
      const res = await request(app)
        .get("/api/users?search=john")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.rows).toBeDefined();
      expect(res.body.rows.length).toBeGreaterThan(0);
    });

    it("should paginate results", async () => {
      const res = await request(app)
        .get("/api/users?page=1&limit=2")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.rows).toBeDefined();
      expect(res.body.rows.length).toBeLessThanOrEqual(2);
      expect(res.body.page).toBe(1);
      expect(res.body.limit).toBe(2);
      expect(res.body.total).toBeDefined();
      expect(res.body.pages).toBeDefined();
    });

    it("should sort users by different fields", async () => {
      const res = await request(app)
        .get("/api/users?sortBy=name&sortOrder=ASC")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.rows).toBeDefined();
      expect(res.body.sort.by).toBe("name");
      expect(res.body.sort.order).toBe("ASC");
    });

    it("should filter users by date range", async () => {
      const today = new Date().toISOString().split("T")[0];
      const res = await request(app)
        .get(`/api/users?startDate=${today}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.rows).toBeDefined();
    });
  });

  describe("Analytics Endpoints", () => {
    it("should get user totals", async () => {
      const res = await request(app)
        .get("/api/users/totals")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.totalUsers).toBeDefined();
      expect(res.body.totalVerifiedUsers).toBeDefined();
      expect(typeof res.body.totalUsers).toBe("number");
      expect(typeof res.body.totalVerifiedUsers).toBe("number");
    });

    it("should get top users by login frequency", async () => {
      const res = await request(app)
        .get("/api/users/analytics/top-logins")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.users).toBeDefined();
      expect(Array.isArray(res.body.users)).toBe(true);
    });

    it("should get inactive users", async () => {
      const res = await request(app)
        .get("/api/users/analytics/inactive?hours=1")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.users).toBeDefined();
      expect(Array.isArray(res.body.users)).toBe(true);
    });

    it("should get user statistics", async () => {
      const res = await request(app)
        .get("/api/users/analytics/statistics")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.totalUsers).toBeDefined();
      expect(res.body.verifiedUsers).toBeDefined();
      expect(res.body.unverifiedUsers).toBeDefined();
      expect(res.body.totalLogins).toBeDefined();
      expect(res.body.verificationRate).toBeDefined();
    });

    it("should get users by role", async () => {
      const res = await request(app)
        .get("/api/users/role/user")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.users).toBeDefined();
      expect(Array.isArray(res.body.users)).toBe(true);
      expect(res.body.users.every((user) => user.role === "user")).toBe(true);
    });

    it("should get recent users", async () => {
      const res = await request(app)
        .get("/api/users/analytics/recent?days=7")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.users).toBeDefined();
      expect(Array.isArray(res.body.users)).toBe(true);
    });

    it("should search users", async () => {
      const res = await request(app)
        .get("/api/users/search?q=john")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.users).toBeDefined();
      expect(Array.isArray(res.body.users)).toBe(true);
    });
  });

  describe("Input Validation and Sanitization", () => {
    it("should sanitize XSS attempts in user updates", async () => {
      const updateData = {
        name: "<script>alert('xss')</script>Safe Name",
      };

      const res = await request(app)
        .put(`/api/users/${testUsers[0].id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send(updateData);

      expect(res.status).toBe(200);
      expect(res.body.user.name).not.toContain("<script>");
      expect(res.body.user.name).toBe("Safe Name");
    });

    it("should validate email format in updates", async () => {
      const updateData = {
        email: "invalid-email",
      };

      const res = await request(app)
        .put(`/api/users/${testUsers[0].id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send(updateData);

      expect(res.status).toBe(400);
      expect(res.body.code).toBe("VALIDATION_ERROR");
    });

    it("should validate pagination parameters", async () => {
      const res = await request(app)
        .get("/api/users?page=0&limit=0")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
      expect(res.body.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("Error Handling", () => {
    it("should return 404 for non-existent user", async () => {
      const res = await request(app)
        .get("/api/users/99999")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
      expect(res.body.code).toBe("NOT_FOUND");
    });

    it("should return 404 when updating non-existent user", async () => {
      const res = await request(app)
        .put("/api/users/99999")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ name: "Updated" });

      expect(res.status).toBe(404);
      expect(res.body.code).toBe("NOT_FOUND");
    });

    it("should return 404 when deleting non-existent user", async () => {
      const res = await request(app)
        .delete("/api/users/99999")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
      expect(res.body.code).toBe("NOT_FOUND");
    });
  });
});
