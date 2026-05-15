const Project = require("../models/Project");

/**
 * Checks if the authenticated user is a member of the project.
 * Attaches req.project and req.memberRole.
 */
const requireProjectMember = async (req, res, next) => {
  try {
    const projectId = req.params.projectId || req.params.id;
    const project = await Project.findById(projectId).populate(
      "members.user",
      "name email"
    );

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const membership = project.members.find(
      (m) => m.user._id.toString() === req.user._id.toString()
    );

    if (!membership) {
      return res
        .status(403)
        .json({ message: "You are not a member of this project" });
    }

    req.project = project;
    req.memberRole = membership.role;
    next();
  } catch (err) {
    next(err);
  }
};

/**
 * Checks if the authenticated user is an admin of the project.
 * Must be used AFTER requireProjectMember or on its own.
 */
const requireProjectAdmin = async (req, res, next) => {
  try {
    // If requireProjectMember already ran, reuse its data
    if (req.project && req.memberRole) {
      if (req.memberRole !== "admin") {
        return res
          .status(403)
          .json({ message: "Admin access required for this action" });
      }
      return next();
    }

    // Otherwise, do the full check
    const projectId = req.params.projectId || req.params.id;
    const project = await Project.findById(projectId).populate(
      "members.user",
      "name email"
    );

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const membership = project.members.find(
      (m) => m.user._id.toString() === req.user._id.toString()
    );

    if (!membership || membership.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Admin access required for this action" });
    }

    req.project = project;
    req.memberRole = membership.role;
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { requireProjectMember, requireProjectAdmin };
