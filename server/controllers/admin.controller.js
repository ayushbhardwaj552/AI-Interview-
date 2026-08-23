import User from "../models/user.models.js";
import Interview from "../models/interview.model.js";
import Payment from "../models/payment.model.js";
import mongoose from "mongoose";

// ─── Helper: convert range string to a start Date ───────────────────────────
const getRangeStart = (range) => {
  const now = new Date();
  switch (range) {
    case "7d":  return new Date(now - 7   * 24 * 60 * 60 * 1000);
    case "90d": return new Date(now - 90  * 24 * 60 * 60 * 1000);
    case "1y":  return new Date(now - 365 * 24 * 60 * 60 * 1000);
    default:    return new Date(now - 30  * 24 * 60 * 60 * 1000); // 30d
  }
};

// ─── GET /api/admin/dashboard ────────────────────────────────────────────────
export const getDashboardStats = async (req, res) => {
  try {
    const now = new Date();
    const todayStart  = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart   = new Date(todayStart.getTime() - 6 * 24 * 60 * 60 * 1000);
    const monthStart  = new Date(now.getFullYear(), now.getMonth(), 1);

    // Run all aggregations in parallel for speed
    const [
      interviewStats,
      userStats,
      revenueStats,
      todayInterviews,
      weekInterviews,
      monthInterviews,
      todayUsers,
      weekUsers,
      monthUsers,
      skillStats
    ] = await Promise.all([
      Interview.aggregate([
        { $group: {
          _id: null,
          total:     { $sum: 1 },
          completed: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } },
          pending:   { $sum: { $cond: [{ $in: ["$status", ["pending", "active"]] }, 1, 0] } },
          avgScore:  { $avg: "$finalScore" }
        }}
      ]),
      User.aggregate([
        { $group: { _id: null, total: { $sum: 1 } } }
      ]),
      Payment.aggregate([
        { $match: { status: "paid" } },
        { $group: {
          _id: null,
          totalRevenue: { $sum: "$amount" },
          totalCredits: { $sum: "$credits" }
        }}
      ]),
      Interview.countDocuments({ createdAt: { $gte: todayStart } }),
      Interview.countDocuments({ createdAt: { $gte: weekStart  } }),
      Interview.countDocuments({ createdAt: { $gte: monthStart } }),
      User.countDocuments({ createdAt: { $gte: todayStart } }),
      User.countDocuments({ createdAt: { $gte: weekStart  } }),
      User.countDocuments({ createdAt: { $gte: monthStart } }),
      Interview.aggregate([
        { $unwind: "$questions" },
        { $group: {
          _id: null,
          avgConfidence:   { $avg: "$questions.confidence" },
          avgCommunication:{ $avg: "$questions.communication" },
          avgCorrectness:  { $avg: "$questions.correctness" },
          totalEvaluations:{ $sum: 1 }
        }}
      ])
    ]);

    const iv = interviewStats[0] || {};
    const rv = revenueStats[0]   || {};
    const sk = skillStats[0]     || {};

    return res.json({
      totalUsers:           userStats[0]?.total || 0,
      totalInterviews:      iv.total    || 0,
      completedInterviews:  iv.completed || 0,
      pendingInterviews:    iv.pending   || 0,
      avgScore:             Number((iv.avgScore || 0).toFixed(1)),
      totalRevenue:         rv.totalRevenue || 0,
      totalCredits:         rv.totalCredits || 0,
      avgConfidence:        Number((sk.avgConfidence    || 0).toFixed(1)),
      avgCommunication:     Number((sk.avgCommunication || 0).toFixed(1)),
      avgCorrectness:       Number((sk.avgCorrectness   || 0).toFixed(1)),
      totalEvaluations:     sk.totalEvaluations || 0,
      interviewsToday:      todayInterviews,
      interviewsThisWeek:   weekInterviews,
      interviewsThisMonth:  monthInterviews,
      newUsersToday:        todayUsers,
      newUsersThisWeek:     weekUsers,
      newUsersThisMonth:    monthUsers
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: `Dashboard stats error: ${error.message}` });
  }
};

// ─── GET /api/admin/users ─────────────────────────────────────────────────────
export const getUsers = async (req, res) => {
  try {
    const page   = Math.max(1, parseInt(req.query.page)  || 1);
    const limit  = Math.min(Math.max(1, parseInt(req.query.limit) || 20), 100);
    const skip   = (page - 1) * limit;
    const search = (req.query.search || "").trim();
    const role   = req.query.role   || "";
    const sort   = req.query.sort   || "newest";

    // Build match filter
    const matchQuery = {};
    if (search) {
      matchQuery.$or = [
        { name:  { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } }
      ];
    }
    if (role && ["user", "admin"].includes(role)) {
      matchQuery.role = role;
    }

    const sortMap = {
      newest:    { createdAt: -1 },
      oldest:    { createdAt:  1 },
      name_asc:  { name:  1 },
      name_desc: { name: -1 }
    };
    const sortObj = sortMap[sort] || { createdAt: -1 };

    const [result] = await User.aggregate([
      { $match: matchQuery },
      { $facet: {
        data: [
          { $sort: sortObj },
          { $skip: skip },
          { $limit: limit },
          { $lookup: {
            from: "interviews",
            localField: "_id",
            foreignField: "userId",
            as: "interviews"
          }},
          { $lookup: {
            from: "payments",
            localField: "_id",
            foreignField: "userId",
            pipeline: [{ $match: { status: "paid" } }],
            as: "paidPayments"
          }},
          { $addFields: {
            totalInterviews: { $size: "$interviews" },
            completedInterviews: {
              $size: {
                $filter: {
                  input: "$interviews",
                  as: "iv",
                  cond: { $eq: ["$$iv.status", "completed"] }
                }
              }
            },
            avgScore:   { $avg: "$interviews.finalScore" },
            totalSpent: { $sum: "$paidPayments.amount" }
          }},
          { $project: { interviews: 0, paidPayments: 0, __v: 0 } }
        ],
        total: [{ $count: "count" }]
      }}
    ]);

    const users      = result?.data  || [];
    const totalUsers = result?.total[0]?.count || 0;

    return res.json({
      users,
      pagination: {
        page,
        limit,
        totalUsers,
        totalPages: Math.ceil(totalUsers / limit)
      }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: `Get users error: ${error.message}` });
  }
};

// ─── GET /api/admin/users/:id ─────────────────────────────────────────────────
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const user = await User.findById(id).select("-__v");
    if (!user) return res.status(404).json({ message: "User not found" });

    const oid = new mongoose.Types.ObjectId(id);

    const [interviewStats, paymentStats, recentInterviews, recentPayments] = await Promise.all([
      Interview.aggregate([
        { $match: { userId: oid } },
        { $group: {
          _id: null,
          totalInterviews:     { $sum: 1 },
          completedInterviews: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } },
          avgScore:            { $avg: "$finalScore" }
        }}
      ]),
      Payment.aggregate([
        { $match: { userId: oid, status: "paid" } },
        { $group: {
          _id: null,
          totalSpent:   { $sum: "$amount" },
          totalCredits: { $sum: "$credits" },
          count:        { $sum: 1 }
        }}
      ]),
      Interview.find({ userId: id })
        .select("role experience mode finalScore status createdAt")
        .sort({ createdAt: -1 })
        .limit(10),
      Payment.find({ userId: id })
        .select("planId amount credits status razorpayOrderId razorpayPaymentId createdAt")
        .sort({ createdAt: -1 })
        .limit(10)
    ]);

    const iv = interviewStats[0] || {};
    const pv = paymentStats[0]   || {};

    return res.json({
      user,
      stats: {
        totalInterviews:     iv.totalInterviews     || 0,
        completedInterviews: iv.completedInterviews || 0,
        avgScore:            Number((iv.avgScore || 0).toFixed(1)),
        totalSpent:          pv.totalSpent   || 0,
        totalCredits:        pv.totalCredits || 0,
        totalPayments:       pv.count        || 0
      },
      recentInterviews,
      recentPayments
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: `Get user error: ${error.message}` });
  }
};

// ─── PUT /api/admin/users/:id/status ─────────────────────────────────────────
export const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    // Prevent admin from locking themselves out
    if (id === req.userId.toString()) {
      return res.status(400).json({ message: "Cannot change your own account status" });
    }

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Prevent disabling other admin accounts
    if (user.role === "admin") {
      return res.status(400).json({ message: "Cannot disable another admin account" });
    }

    user.isActive = !user.isActive;
    await user.save();

    return res.json({
      message:  `User ${user.isActive ? "enabled" : "disabled"} successfully`,
      isActive: user.isActive,
      success:  true
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: `Update user status error: ${error.message}` });
  }
};

// ─── GET /api/admin/interviews ────────────────────────────────────────────────
export const getInterviews = async (req, res) => {
  try {
    const page   = Math.max(1, parseInt(req.query.page)  || 1);
    const limit  = Math.min(Math.max(1, parseInt(req.query.limit) || 20), 100);
    const skip   = (page - 1) * limit;
    const mode   = req.query.mode   || "";
    const status = req.query.status || "";
    const search = (req.query.search || "").trim();

    const matchQuery = {};
    if (mode   && ["HR", "Technical"].includes(mode))                 matchQuery.mode   = mode;
    if (status && ["pending","active","completed"].includes(status))   matchQuery.status = status;

    // Search by candidate name/email: first resolve matching user IDs
    if (search) {
      const matchingUsers = await User.find({
        $or: [
          { name:  { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } }
        ]
      }).select("_id");
      matchQuery.userId = { $in: matchingUsers.map(u => u._id) };
    }

    const [total, interviews] = await Promise.all([
      Interview.countDocuments(matchQuery),
      Interview.find(matchQuery)
        .populate("userId", "name email")
        .select("userId role experience mode finalScore status createdAt")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
    ]);

    return res.json({
      interviews,
      pagination: {
        page, limit,
        totalInterviews: total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: `Get interviews error: ${error.message}` });
  }
};

// ─── GET /api/admin/interviews/:id ────────────────────────────────────────────
export const getInterviewById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid interview ID" });
    }

    const interview = await Interview.findById(id)
      .populate("userId", "name email credits role");

    if (!interview) return res.status(404).json({ message: "Interview not found" });

    return res.json(interview);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: `Get interview error: ${error.message}` });
  }
};

// ─── GET /api/admin/payments ──────────────────────────────────────────────────
export const getPayments = async (req, res) => {
  try {
    const page   = Math.max(1, parseInt(req.query.page)  || 1);
    const limit  = Math.min(Math.max(1, parseInt(req.query.limit) || 20), 100);
    const skip   = (page - 1) * limit;
    const status = req.query.status || "";
    const planId = req.query.planId || "";

    const matchQuery = {};
    if (status && ["paid","created","failed"].includes(status)) matchQuery.status = status;
    if (planId && ["basic","pro"].includes(planId))             matchQuery.planId = planId;

    const [total, payments, [stats]] = await Promise.all([
      Payment.countDocuments(matchQuery),
      Payment.find(matchQuery)
        .populate("userId", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Payment.aggregate([
        { $group: {
          _id: null,
          total:        { $sum: 1 },
          successful:   { $sum: { $cond: [{ $eq: ["$status", "paid"]    }, 1, 0] } },
          failed:       { $sum: { $cond: [{ $eq: ["$status", "failed"]  }, 1, 0] } },
          totalRevenue: { $sum: { $cond: [{ $eq: ["$status", "paid"]    }, "$amount", 0] } },
          avgAmount:    { $avg: { $cond: [{ $eq: ["$status", "paid"]    }, "$amount", null] } }
        }}
      ])
    ]);

    const sv = stats || {};
    return res.json({
      payments,
      stats: {
        total:        sv.total        || 0,
        successful:   sv.successful   || 0,
        failed:       sv.failed       || 0,
        totalRevenue: sv.totalRevenue || 0,
        avgAmount:    Number((sv.avgAmount || 0).toFixed(0))
      },
      pagination: {
        page, limit,
        totalPayments: total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: `Get payments error: ${error.message}` });
  }
};

// ─── GET /api/admin/analytics/revenue?range=30d ───────────────────────────────
export const getRevenueAnalytics = async (req, res) => {
  try {
    const range     = req.query.range || "30d";
    const startDate = getRangeStart(range);
    const dateFmt   = range === "1y" ? "%Y-%m" : "%Y-%m-%d";

    const [overTime, byPlan, summary] = await Promise.all([
      Payment.aggregate([
        { $match: { status: "paid", createdAt: { $gte: startDate } } },
        { $group: {
          _id:     { $dateToString: { format: dateFmt, date: "$createdAt" } },
          revenue: { $sum: "$amount" },
          count:   { $sum: 1 }
        }},
        { $sort: { _id: 1 } }
      ]),
      Payment.aggregate([
        { $match: { status: "paid" } },
        { $group: {
          _id:     "$planId",
          revenue: { $sum: "$amount" },
          count:   { $sum: 1 },
          credits: { $sum: "$credits" }
        }}
      ]),
      Payment.aggregate([
        { $group: {
          _id:    "$status",
          count:  { $sum: 1 },
          amount: { $sum: "$amount" }
        }}
      ])
    ]);

    return res.json({ overTime, byPlan, summary });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: `Revenue analytics error: ${error.message}` });
  }
};

// ─── GET /api/admin/analytics/interviews?range=30d ───────────────────────────
export const getInterviewAnalytics = async (req, res) => {
  try {
    const range     = req.query.range || "30d";
    const startDate = getRangeStart(range);
    const dateFmt   = range === "1y" ? "%Y-%m" : "%Y-%m-%d";

    const [overTime, byMode, byStatus, byExperience, avgScoreOverTime] = await Promise.all([
      Interview.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        { $group: {
          _id:   { $dateToString: { format: dateFmt, date: "$createdAt" } },
          count: { $sum: 1 }
        }},
        { $sort: { _id: 1 } }
      ]),
      Interview.aggregate([
        { $group: { _id: "$mode", count: { $sum: 1 } } }
      ]),
      Interview.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } }
      ]),
      Interview.aggregate([
        { $group: {
          _id:      "$experience",
          count:    { $sum: 1 },
          avgScore: { $avg: "$finalScore" }
        }},
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),
      Interview.aggregate([
        { $match: { createdAt: { $gte: startDate }, status: "completed", finalScore: { $gt: 0 } } },
        { $group: {
          _id:      { $dateToString: { format: dateFmt, date: "$createdAt" } },
          avgScore: { $avg: "$finalScore" }
        }},
        { $sort: { _id: 1 } }
      ])
    ]);

    return res.json({ overTime, byMode, byStatus, byExperience, avgScoreOverTime });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: `Interview analytics error: ${error.message}` });
  }
};

// ─── GET /api/admin/analytics/users?range=30d ─────────────────────────────────
export const getUserGrowthAnalytics = async (req, res) => {
  try {
    const range      = req.query.range || "30d";
    const startDate  = getRangeStart(range);
    const dateFmt    = range === "1y" ? "%Y-%m" : "%Y-%m-%d";

    const now          = new Date();
    const todayStart   = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart    = new Date(todayStart.getTime() - 6 * 24 * 60 * 60 * 1000);
    const monthStart   = new Date(now.getFullYear(), now.getMonth(), 1);
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const [overTime, todayCount, weekCount, monthCount, prevMonthCount] = await Promise.all([
      User.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        { $group: {
          _id:   { $dateToString: { format: dateFmt, date: "$createdAt" } },
          count: { $sum: 1 }
        }},
        { $sort: { _id: 1 } }
      ]),
      User.countDocuments({ createdAt: { $gte: todayStart } }),
      User.countDocuments({ createdAt: { $gte: weekStart  } }),
      User.countDocuments({ createdAt: { $gte: monthStart } }),
      User.countDocuments({ createdAt: { $gte: prevMonthStart, $lt: monthStart } })
    ]);

    const growthPct = prevMonthCount > 0
      ? Number(((monthCount - prevMonthCount) / prevMonthCount * 100).toFixed(1))
      : (monthCount > 0 ? 100 : 0);

    return res.json({ overTime, todayCount, weekCount, monthCount, prevMonthCount, growthPct });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: `User growth analytics error: ${error.message}` });
  }
};

// ─── GET /api/admin/analytics/ai ─────────────────────────────────────────────
export const getAIAnalytics = async (req, res) => {
  try {
    const [overall, byDifficulty, byMode, byExperience] = await Promise.all([
      Interview.aggregate([
        { $unwind: "$questions" },
        { $group: {
          _id: null,
          totalEvaluations: { $sum: 1 },
          avgScore:         { $avg: "$questions.score" },
          avgConfidence:    { $avg: "$questions.confidence" },
          avgCommunication: { $avg: "$questions.communication" },
          avgCorrectness:   { $avg: "$questions.correctness" }
        }}
      ]),
      Interview.aggregate([
        { $unwind: "$questions" },
        { $group: {
          _id:             "$questions.difficulty",
          avgScore:        { $avg: "$questions.score" },
          avgConfidence:   { $avg: "$questions.confidence" },
          avgCommunication:{ $avg: "$questions.communication" },
          avgCorrectness:  { $avg: "$questions.correctness" },
          count:           { $sum: 1 }
        }},
        { $sort: { _id: 1 } }
      ]),
      Interview.aggregate([
        { $group: {
          _id:      "$mode",
          avgScore: { $avg: "$finalScore" },
          count:    { $sum: 1 }
        }}
      ]),
      Interview.aggregate([
        { $group: {
          _id:      "$experience",
          avgScore: { $avg: "$finalScore" },
          count:    { $sum: 1 }
        }},
        { $sort: { count: -1 } },
        { $limit: 10 }
      ])
    ]);

    const ov = overall[0] || {};
    return res.json({
      overall: {
        totalEvaluations: ov.totalEvaluations || 0,
        avgScore:         Number((ov.avgScore         || 0).toFixed(1)),
        avgConfidence:    Number((ov.avgConfidence    || 0).toFixed(1)),
        avgCommunication: Number((ov.avgCommunication || 0).toFixed(1)),
        avgCorrectness:   Number((ov.avgCorrectness   || 0).toFixed(1))
      },
      byDifficulty,
      byMode,
      byExperience
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: `AI analytics error: ${error.message}` });
  }
};

// ─── GET /api/admin/top-users ─────────────────────────────────────────────────
export const getTopUsers = async (req, res) => {
  try {
    const [topByScore, topByActivity] = await Promise.all([
      Interview.aggregate([
        { $match: { status: "completed", finalScore: { $gt: 0 } } },
        { $group: {
          _id:             "$userId",
          avgScore:        { $avg: "$finalScore" },
          totalInterviews: { $sum: 1 }
        }},
        { $sort: { avgScore: -1 } },
        { $limit: 10 },
        { $lookup: {
          from: "users", localField: "_id", foreignField: "_id", as: "user"
        }},
        { $unwind: "$user" },
        { $project: {
          "user.name": 1, "user.email": 1, avgScore: 1, totalInterviews: 1
        }}
      ]),
      Interview.aggregate([
        { $group: {
          _id:                "$userId",
          totalInterviews:    { $sum: 1 },
          completedInterviews:{ $sum: { $cond: [{ $eq: ["$status","completed"] }, 1, 0] } }
        }},
        { $sort: { totalInterviews: -1 } },
        { $limit: 10 },
        { $lookup: {
          from: "users", localField: "_id", foreignField: "_id", as: "user"
        }},
        { $unwind: "$user" },
        { $project: {
          "user.name": 1, "user.email": 1, totalInterviews: 1, completedInterviews: 1
        }}
      ])
    ]);

    return res.json({ topByScore, topByActivity });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: `Top users error: ${error.message}` });
  }
};
