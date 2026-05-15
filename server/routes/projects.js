const express = require("express");
const Joi = require("joi");
const Project = require("../models/Project");
const Task = require("../models/Task");
const User = require("../models/User");
const authenticate = require("../middleware/auth");
const { requireProjectMember, requireProjectAdmin } = require("../middleware/rbac");

const router = express.Router();

// Validation schemas
const createProjectSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  description: Joi.string().max(500).allow("").optional(),
});

const updateProjectSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  description: Joi.string().max(500).allow("").optional(),
}).min(1);

const addMemberSchema = Joi.object({
  email: Joi.string().email().required(),
  role: Joi.string().valid("admin", "member").default("member"),
});

// All routes require authentication
router.use(authenticate);

// POST /api/projects — Create a new project
router.post("/", async (req, res, next) => {
  try {
    const { error, value } = createProjectSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const project = await Project.create({
      name: value.name,
      description: value.description || "",
      owner: req.user._id,
      members: [{ user: req.user._id, role: "admin" }],
    });

    // Populate for response
    await project.populate("members.user", "name email");

    res.status(201).json(project);
  } catch (err) {
    next(err);
  }
});

// GET /api/projects — List current user's projects
router.get("/", async (req, res, next) => {
  try {
    const projects = await Project.find({ "members.user": req.user._id })
      .populate("members.user", "name email")
      .populate("owner", "name email")
      .sort({ updatedAt: -1 });

    // Attach task counts to each project
    const projectsWithCounts = await Promise.all(
      projects.map(async (project) => {
        const taskCounts = await Task.aggregate([
          { $match: { project: project._id } },
          { $group: { _id: "$status", count: { $sum: 1 } } },
        ]);

        const counts = { todo: 0, "in-progress": 0, done: 0, total: 0 };
        taskCounts.forEach((tc) => {
          counts[tc._id] = tc.count;
          counts.total += tc.count;
        });

        return { ...project.toObject(), taskCounts: counts };
      })
    );

    res.json(projectsWithCounts);
  } catch (err) {
    next(err);
  }
});

// GET /api/projects/:id — Get project detail
router.get("/:id", requireProjectMember, async (req, res, next) => {
  try {
    const project = req.project;
    await project.populate("owner", "name email");

    const taskCounts = await Task.aggregate([
      { $match: { project: project._id } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    const counts = { todo: 0, "in-progress": 0, done: 0, total: 0 };
    taskCounts.forEach((tc) => {
      counts[tc._id] = tc.count;
      counts.total += tc.count;
    });

    res.json({ ...project.toObject(), taskCounts: counts });
  } catch (err) {
    next(err);
  }
});

// PUT /api/projects/:id — Update project (admin only)
router.put("/:id", requireProjectAdmin, async (req, res, next) => {
  try {
    const { error, value } = updateProjectSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const project = await Project.findByIdAndUpdate(req.params.id, value, {
      new: true,
    }).populate("members.user", "name email");

    res.json(project);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/projects/:id — Delete project + all tasks (admin only)
router.delete("/:id", requireProjectAdmin, async (req, res, next) => {
  try {
    await Task.deleteMany({ project: req.params.id });
    await Project.findByIdAndDelete(req.params.id);
    res.json({ message: "Project and all associated tasks deleted" });
  } catch (err) {
    next(err);
  }
});

// POST /api/projects/:id/members — Add a member (admin only)
router.post("/:id/members", requireProjectAdmin, async (req, res, next) => {
  try {
    const { error, value } = addMemberSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const userToAdd = await User.findOne({ email: value.email });
    if (!userToAdd) {
      return res.status(404).json({ message: "No user found with that email" });
    }

    const project = req.project;

    // Check if already a member
    const alreadyMember = project.members.some(
      (m) => m.user._id.toString() === userToAdd._id.toString()
    );
    if (alreadyMember) {
      return res.status(409).json({ message: "User is already a member" });
    }

    project.members.push({ user: userToAdd._id, role: value.role });
    await project.save();
    await project.populate("members.user", "name email");

    res.status(201).json(project);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/projects/:id/members/:userId — Remove a member (admin only)
router.delete("/:id/members/:userId", requireProjectAdmin, async (req, res, next) => {
  try {
    const project = req.project;

    // Cannot remove the project owner
    if (project.owner.toString() === req.params.userId) {
      return res.status(400).json({ message: "Cannot remove the project owner" });
    }

    project.members = project.members.filter(
      (m) => m.user._id.toString() !== req.params.userId
    );
    await project.save();
    await project.populate("members.user", "name email");

    res.json(project);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
