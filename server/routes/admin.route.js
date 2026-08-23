import express from "express";
import isAuth from "../middlewares/isAuth.js";
import isAdmin from "../middlewares/isAdmin.js";
import {
  getDashboardStats,
  getUsers,
  getUserById,
  updateUserStatus,
  getInterviews,
  getInterviewById,
  getPayments,
  getRevenueAnalytics,
  getInterviewAnalytics,
  getUserGrowthAnalytics,
  getAIAnalytics,
  getTopUsers
} from "../controllers/admin.controller.js";

const adminRouter = express.Router();

// Apply isAuth + isAdmin to every admin route at the router level.
// No single admin route can be accessed without both checks passing.
adminRouter.use(isAuth, isAdmin);

adminRouter.get("/dashboard",              getDashboardStats);
adminRouter.get("/users",                  getUsers);
adminRouter.get("/users/:id",              getUserById);
adminRouter.put("/users/:id/status",       updateUserStatus);
adminRouter.get("/interviews",             getInterviews);
adminRouter.get("/interviews/:id",         getInterviewById);
adminRouter.get("/payments",               getPayments);
adminRouter.get("/analytics/revenue",      getRevenueAnalytics);
adminRouter.get("/analytics/interviews",   getInterviewAnalytics);
adminRouter.get("/analytics/users",        getUserGrowthAnalytics);
adminRouter.get("/analytics/ai",           getAIAnalytics);
adminRouter.get("/top-users",              getTopUsers);

export default adminRouter;
