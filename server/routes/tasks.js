const express = require("express");
const Joi = require("joi");
const Task = require("../models/Task");
const authenticate = require("../middleware/auth");
const { requireProjectMember, requireProjectAdmin } = require("../middleware/rbac");

// mergeParams to access :projectId from parent router
const router = express.Router({ mergeParams: true });

// Validation schemas
const createTaskSchema = Joi.object({
  title: Joi.string().min(2).max(200).required(),
  description: Joi.string().max(1000).allow("").optional(),
  assignee: Joi.string().hex().length(24).allow(null, "").optional(),
  status: Joi.string().valid("todo", "in-progress", "done").default("todo"),
  priority: Joi.string().valid("low", "medium", "high").default("medium"),
  dueDate: Joi.date().iso().allow(null).optional(),
});

const updateTaskSchema = Joi.object({
  title: Joi.string().min(2).max(200).optional(),
  description: Joi.string().max(1000).allow("").optional(),
  assignee: Joi.string().hex().length(24).allow(null, "").optional(),
  status: Joi.string().valid("todo", "in-progress", "done").optional(),
  priority: Joi.string().valid("low", "medium", "high").optional(),
  dueDate: Joi.date().iso().allow(null).optional(),
}).min(1);

// All routes require authentication
router.use(authenticate);

// POST /api/projects/:projectId/tasks — Create task (admin only)
router.post("/", requireProjectAdmin, async (req, res, next) => {
  try {
    const { error, value } = createTaskSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    // If assignee provided, verify they are a project member
    if (value.assignee) {
      const isMember = req.project.members.some(
        (m) => m.user._id.toString() === value.assignee
      );
      if (!isMember) {
        return res
          .status(400)
          .json({ message: "Assignee must be a project member" });
      }
    }

    const task = await Task.create({
      ...value,
      project: req.params.projectId,
      createdBy: req.user._id,
    });

    await task.populate("assignee", "name email");
    await task.populate("createdBy", "name email");

    res.status(201).json(task);
  } catch (err) {
    next(err);
  }
});

// GET /api/projects/:projectId/tasks — List tasks with filters
router.get("/", requireProjectMember, async (req, res, next) => {
  try {
    const filter = { project: req.params.projectId };

    if (req.query.status) filter.status = req.query.status;
    if (req.query.priority) filter.priority = req.query.priority;
    if (req.query.assignee) filter.assignee = req.query.assignee;

    const tasks = await Task.find(filter)
      .populate("assignee", "name email")
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    res.json(tasks);
  } catch (err) {
    next(err);
  }
});

// GET /api/projects/:projectId/tasks/:taskId — Get single task
router.get("/:taskId", requireProjectMember, async (req, res, next) => {
  try {
    const task = await Task.findOne({
      _id: req.params.taskId,
      project: req.params.projectId,
    })
      .populate("assignee", "name email")
      .populate("createdBy", "name email");

    if (!task) return res.status(404).json({ message: "Task not found" });

    res.json(task);
  } catch (err) {
    next(err);
  }
});

// PUT /api/projects/:projectId/tasks/:taskId — Update task
// Admin: all fields | Member: status only
router.put("/:taskId", requireProjectMember, async (req, res, next) => {
  try {
    let updateData = req.body;

    // If member, restrict to status-only updates
    if (req.memberRole === "member") {
      if (Object.keys(req.body).some((key) => key !== "status")) {
        return res
          .status(403)
          .json({ message: "Members can only update task status" });
      }
      const statusSchema = Joi.object({
        status: Joi.string().valid("todo", "in-progress", "done").required(),
      });
      const { error, value } = statusSchema.validate(req.body);
      if (error) return res.status(400).json({ message: error.details[0].message });
      updateData = value;
    } else {
      const { error, value } = updateTaskSchema.validate(req.body);
      if (error) return res.status(400).json({ message: error.details[0].message });
      updateData = value;
    }

    const task = await Task.findOneAndUpdate(
      { _id: req.params.taskId, project: req.params.projectId },
      updateData,
      { new: true }
    )
      .populate("assignee", "name email")
      .populate("createdBy", "name email");

    if (!task) return res.status(404).json({ message: "Task not found" });

    res.json(task);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/projects/:projectId/tasks/:taskId — Delete task (admin only)
router.delete("/:taskId", requireProjectAdmin, async (req, res, next) => {
  try {
    const task = await Task.findOneAndDelete({
      _id: req.params.taskId,
      project: req.params.projectId,
    });

    if (!task) return res.status(404).json({ message: "Task not found" });

    res.json({ message: "Task deleted" });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
