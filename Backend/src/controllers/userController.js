import {
  getUser,
  updateUser,
  deleteUser,
  listUsersService,
  getTotals,
  getTopUsersByLogin,
  getInactiveUsers,
  checkEmailExists,
  getUserStatisticsService,
  getUsersByRoleService,
  getRecentUsersService,
  searchUsersService,
} from "../services/userService.js";

export async function getById(req, res, next) {
  try {
    const user = await getUser(req.params.id);
    res.json({ user });
  } catch (err) {
    next(err);
  }
}

export async function updateById(req, res, next) {
  try {
    const user = await updateUser(req.params.id, req.body);
    res.json({ user });
  } catch (err) {
    next(err);
  }
}

export async function deleteById(req, res, next) {
  try {
    await deleteUser(req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function list(req, res, next) {
  try {
    const result = await listUsersService(req.query);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function totals(_req, res, next) {
  try {
    const result = await getTotals();
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function topLogins(req, res, next) {
  try {
    const limit = req.query.limit ? Number(req.query.limit) : 3;
    const rows = await getTopUsersByLogin(limit);
    res.json({ users: rows });
  } catch (err) {
    next(err);
  }
}

export async function inactive(req, res, next) {
  try {
    const hours = req.query.hours ? Number(req.query.hours) : null;
    const months = req.query.months ? Number(req.query.months) : null;
    const users = await getInactiveUsers({ hours, months });
    res.json({ users });
  } catch (err) {
    next(err);
  }
}

// New controller functions using additional repository capabilities

export async function checkEmail(req, res, next) {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ error: "Email parameter is required" });
    }
    const exists = await checkEmailExists(email);
    res.json({ exists });
  } catch (err) {
    next(err);
  }
}

export async function statistics(req, res, next) {
  try {
    const stats = await getUserStatisticsService();
    res.json(stats);
  } catch (err) {
    next(err);
  }
}

export async function usersByRole(req, res, next) {
  try {
    const { role } = req.params;
    const users = await getUsersByRoleService(role);
    res.json({ users });
  } catch (err) {
    next(err);
  }
}

export async function recentUsers(req, res, next) {
  try {
    const days = req.query.days ? Number(req.query.days) : 7;
    const users = await getRecentUsersService(days);
    res.json({ users });
  } catch (err) {
    next(err);
  }
}

export async function search(req, res, next) {
  try {
    const searchCriteria = {
      query: req.query.q,
      role: req.query.role,
      isVerified:
        req.query.verified !== undefined
          ? req.query.verified === "true"
          : undefined,
      limit: req.query.limit ? Number(req.query.limit) : 10,
    };
    const users = await searchUsersService(searchCriteria);
    res.json({ users });
  } catch (err) {
    next(err);
  }
}

export async function registrationStats(req, res, next) {
  try {
    const { startDate, endDate } = req.query;
    const { getRegistrationStatisticsService } = await import(
      "../services/userService.js"
    );
    const stats = await getRegistrationStatisticsService({
      startDate,
      endDate,
    });
    res.json(stats);
  } catch (err) {
    next(err);
  }
}
