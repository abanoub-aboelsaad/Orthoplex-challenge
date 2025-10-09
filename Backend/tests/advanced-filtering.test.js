import request from "supertest";
import app from "../src/app.js";
import { query } from "../src/config/database.js";

describe("Advanced Filtering and Analytics", () => {
  let adminToken;
  let testUsers = [];

  beforeAll(async () => {
    // Clean up test data
    await query(
      "DELETE FROM user_logins WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%filter%')"
    );
    await query("DELETE FROM users WHERE email LIKE '%filter%'");

    // Create admin user
    const adminData = {
      name: "Filter Admin",
      email: "filter-admin@test.com",
      password: "password123",
      role: "admin",
    };

    const adminRes = await request(app)
      .post("/api/auth/register")
      .send(adminData);

    adminToken = (
      await request(app)
        .post("/api/auth/login")
        .send({ email: adminData.email, password: adminData.password })
    ).body.token;

    // Create test users with different characteristics
    const usersData = [
      {
        name: "Alice Johnson",
        email: "alice@filter.com",
        password: "password123",
        role: "user",
      },
      {
        name: "Bob Smith",
        email: "bob@filter.com",
        password: "password123",
        role: "user",
      },
      {
        name: "Charlie Brown",
        email: "charlie@filter.com",
        password: "password123",
        role: "user",
      },
      {
        name: "Diana Prince",
        email: "diana@filter.com",
        password: "password123",
        role: "admin",
      },
      {
        name: "Eve Wilson",
        email: "eve@filter.com",
        password: "password123",
        role: "user",
      },
    ];

    for (const userData of usersData) {
      const res = await request(app).post("/api/auth/register").send(userData);
      testUsers.push(res.body.user);
    }

    // Simulate some login activity
    await query("INSERT INTO user_logins (user_id) VALUES (?)", [
      testUsers[0].id,
    ]);
    await query("INSERT INTO user_logins (user_id) VALUES (?)", [
      testUsers[0].id,
    ]);
    await query("INSERT INTO user_logins (user_id) VALUES (?)", [
      testUsers[1].id,
    ]);
    await query("INSERT INTO user_logins (user_id) VALUES (?)", [
      testUsers[2].id,
    ]);
  });

  afterAll(async () => {
    // Clean up test data
    const userIds = testUsers.map((u) => u.id);
    await query("DELETE FROM user_logins WHERE user_id IN (?)", [userIds]);
    await query("DELETE FROM users WHERE id IN (?)", [userIds]);
  });

  describe("Advanced Filtering", () => {
    it("should filter users by role", async () => {
      const res = await request(app)
        .get("/api/users?role=user")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.rows).toBeDefined();
      expect(res.body.rows.every((user) => user.role === "user")).toBe(true);
    });

    it("should filter users by verification status", async () => {
      const res = await request(app)
        .get("/api/users?isVerified=true")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.rows).toBeDefined();
      expect(res.body.rows.every((user) => user.is_verified === 1)).toBe(true);
    });

    it("should search users with general search", async () => {
      const res = await request(app)
        .get("/api/users?search=alice")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.rows).toBeDefined();
      expect(res.body.rows.length).toBeGreaterThan(0);
      expect(
        res.body.rows.some((user) => user.name.toLowerCase().includes("alice"))
      ).toBe(true);
    });

    it("should filter users by login activity", async () => {
      const res = await request(app)
        .get("/api/users?hasLogins=true")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.rows).toBeDefined();
      expect(res.body.rows.every((user) => user.login_count > 0)).toBe(true);
    });

    it("should filter users without login activity", async () => {
      const res = await request(app)
        .get("/api/users?hasLogins=false")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.rows).toBeDefined();
      expect(res.body.rows.every((user) => user.login_count === 0)).toBe(true);
    });

    it("should filter users by date range", async () => {
      const today = new Date().toISOString().split("T")[0];
      const res = await request(app)
        .get(`/api/users?startDate=${today}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.rows).toBeDefined();
    });

    it("should combine multiple filters", async () => {
      const res = await request(app)
        .get("/api/users?role=user&isVerified=true&hasLogins=true")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.rows).toBeDefined();
      expect(
        res.body.rows.every(
          (user) =>
            user.role === "user" &&
            user.is_verified === 1 &&
            user.login_count > 0
        )
      ).toBe(true);
    });
  });

  describe("Sorting", () => {
    it("should sort users by name ascending", async () => {
      const res = await request(app)
        .get("/api/users?sortBy=name&sortOrder=ASC")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.rows).toBeDefined();
      expect(res.body.sort.by).toBe("name");
      expect(res.body.sort.order).toBe("ASC");
    });

    it("should sort users by email descending", async () => {
      const res = await request(app)
        .get("/api/users?sortBy=email&sortOrder=DESC")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.rows).toBeDefined();
      expect(res.body.sort.by).toBe("email");
      expect(res.body.sort.order).toBe("DESC");
    });

    it("should sort users by creation date", async () => {
      const res = await request(app)
        .get("/api/users?sortBy=created_at&sortOrder=DESC")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.rows).toBeDefined();
      expect(res.body.sort.by).toBe("created_at");
      expect(res.body.sort.order).toBe("DESC");
    });
  });

  describe("Pagination", () => {
    it("should paginate results correctly", async () => {
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

    it("should handle pagination metadata", async () => {
      const res = await request(app)
        .get("/api/users?page=2&limit=3")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.page).toBe(2);
      expect(res.body.limit).toBe(3);
      expect(res.body.total).toBeGreaterThan(0);
      expect(res.body.pages).toBe(Math.ceil(res.body.total / 3));
    });
  });

  describe("Analytics Endpoints", () => {
    it("should get comprehensive user statistics", async () => {
      const res = await request(app)
        .get("/api/users/analytics/statistics")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.totalUsers).toBeDefined();
      expect(res.body.verifiedUsers).toBeDefined();
      expect(res.body.unverifiedUsers).toBeDefined();
      expect(res.body.totalLogins).toBeDefined();
      expect(res.body.verificationRate).toBeDefined();
      expect(typeof res.body.verificationRate).toBe("number");
    });

    it("should get top users by login frequency", async () => {
      const res = await request(app)
        .get("/api/users/analytics/top-logins?limit=3")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.users).toBeDefined();
      expect(Array.isArray(res.body.users)).toBe(true);
      expect(res.body.users.length).toBeLessThanOrEqual(3);
    });

    it("should get inactive users by hours", async () => {
      const res = await request(app)
        .get("/api/users/analytics/inactive?hours=24")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.users).toBeDefined();
      expect(Array.isArray(res.body.users)).toBe(true);
    });

    it("should get inactive users by months", async () => {
      const res = await request(app)
        .get("/api/users/analytics/inactive?months=1")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.users).toBeDefined();
      expect(Array.isArray(res.body.users)).toBe(true);
    });

    it("should get recent users", async () => {
      const res = await request(app)
        .get("/api/users/analytics/recent?days=7")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.users).toBeDefined();
      expect(Array.isArray(res.body.users)).toBe(true);
    });

    it("should search users with advanced criteria", async () => {
      const res = await request(app)
        .get("/api/users/search?q=alice&role=user&verified=true")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.users).toBeDefined();
      expect(Array.isArray(res.body.users)).toBe(true);
    });
  });

  describe("Input Validation", () => {
    it("should validate sort parameters", async () => {
      const res = await request(app)
        .get("/api/users?sortBy=invalid_field&sortOrder=INVALID")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      // Should fallback to default values
      expect(res.body.sort.by).toBe("created_at");
      expect(res.body.sort.order).toBe("DESC");
    });

    it("should validate pagination parameters", async () => {
      const res = await request(app)
        .get("/api/users?page=-1&limit=0")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
      expect(res.body.code).toBe("VALIDATION_ERROR");
    });

    it("should sanitize search input", async () => {
      const res = await request(app)
        .get("/api/users?search=<script>alert('xss')</script>")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.rows).toBeDefined();
    });
  });
});
