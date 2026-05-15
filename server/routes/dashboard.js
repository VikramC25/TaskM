const express = require("express");
const mongoose = require("mongoose");
const Task = require("../models/Task");
const Project = require("../models/Project");
const authenticate = require("../middleware/auth");

const router = express.Router();

router.use(authenticate);

// GET /api/dashboard/stats
router.get("/stats", async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Get all projects the user belongs to
    const projects = await Project.find({ "members.user": userId })
      .populate("owner", "name email")
      .populate("members.user", "name email");

    const projectIds = projects.map((p) => p._id);

    // Aggregate task stats across all user's projects
    const [statusAgg, priorityAgg, overdueCount, recentTasks] =
      await Promise.all([
        // Tasks grouped by status
        Task.aggregate([
          { $match: { project: { $in: projectIds } } },
          { $group: { _id: "$status", count: { $sum: 1 } } },
        ]),

        // Tasks grouped by priority
        Task.aggregate([
          { $match: { project: { $in: projectIds } } },
          { $group: { _id: "$priority", count: { $sum: 1 } } },
        ]),

        // Overdue tasks (due date < now and not done)
        Task.countDocuments({
          project: { $in: projectIds },
          dueDate: { $lt: new Date() },
          status: { $ne: "done" },
        }),

        // Recent tasks (last 10)
        Task.find({ project: { $in: projectIds } })
          .populate("assignee", "name email")
          .populate("project", "name")
          .sort({ createdAt: -1 })
          .limit(10),
      ]);

    // Build status counts object
    const statusCounts = { todo: 0, "in-progress": 0, done: 0 };
    statusAgg.forEach((s) => {
      statusCounts[s._id] = s.count;
    });
    const totalTasks =
      statusCounts.todo + statusCounts["in-progress"] + statusCounts.done;

    // Build priority counts object
    const priorityCounts = { low: 0, medium: 0, high: 0 };
    priorityAgg.forEach((p) => {
      priorityCounts[p._id] = p.count;
    });

    // My tasks (assigned to current user)
    const myTasks = await Task.countDocuments({
      assignee: userId,
      status: { $ne: "done" },
    });

    res.json({
      totalProjects: projects.length,
      totalTasks,
      statusCounts,
      priorityCounts,
      overdueCount,
      myTasks,
      recentTasks,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
