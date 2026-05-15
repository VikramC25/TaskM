import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getProject, deleteProject, addMember, removeMember, getTasks, createTask, updateTask, deleteTask } from "../services/api";
import Modal from "../components/Modal";

export default function ProjectDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState("member");

  // Filters
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");

  // Modals
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  // Forms
  const emptyTask = { title: "", description: "", assignee: "", status: "todo", priority: "medium", dueDate: "" };
  const [taskForm, setTaskForm] = useState(emptyTask);
  const [memberEmail, setMemberEmail] = useState("");
  const [memberRole, setMemberRoleForm] = useState("member");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [proj, taskList] = await Promise.all([
        getProject(id),
        getTasks(id, buildQuery()),
      ]);
      setProject(proj);
      setTasks(taskList);
      const membership = proj.members?.find((m) => m.user?._id === user?._id);
      setRole(membership?.role || "member");
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id, user]);

  const buildQuery = () => {
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    if (priorityFilter) params.set("priority", priorityFilter);
    return params.toString();
  };

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (!loading) {
      getTasks(id, buildQuery()).then(setTasks).catch(console.error);
    }
  }, [statusFilter, priorityFilter]);

  const isAdmin = role === "admin";

  // Task CRUD
  const handleTaskSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const payload = { ...taskForm };
      if (!payload.assignee) delete payload.assignee;
      if (!payload.dueDate) delete payload.dueDate;

      if (editingTask) {
        await updateTask(id, editingTask._id, payload);
      } else {
        await createTask(id, payload);
      }
      setShowTaskModal(false);
      setEditingTask(null);
      setTaskForm(emptyTask);
      fetchData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
    setTaskForm({
      title: task.title,
      description: task.description || "",
      assignee: task.assignee?._id || "",
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate ? task.dueDate.split("T")[0] : "",
    });
    setError("");
    setShowTaskModal(true);
  };

  const handleDeleteTask = async (taskId) => {
    if (!confirm("Delete this task?")) return;
    try {
      await deleteTask(id, taskId);
      fetchData();
    } catch (err) { alert(err.message); }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await updateTask(id, taskId, { status: newStatus });
      fetchData();
    } catch (err) { alert(err.message); }
  };

  // Member management
  const handleAddMember = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await addMember(id, { email: memberEmail, role: memberRole });
      setMemberEmail("");
      setMemberRoleForm("member");
      setShowMemberModal(false);
      fetchData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!confirm("Remove this member?")) return;
    try {
      await removeMember(id, userId);
      fetchData();
    } catch (err) { alert(err.message); }
  };

  const handleDeleteProject = async () => {
    if (!confirm("Delete this project and all its tasks? This cannot be undone.")) return;
    try {
      await deleteProject(id);
      navigate("/projects");
    } catch (err) { alert(err.message); }
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "";
  const isOverdue = (d, status) => d && status !== "done" && new Date(d) < new Date();

  if (loading) return <div className="loading"><div className="spinner"></div></div>;
  if (!project) return <div className="empty-state"><h3>Project not found</h3></div>;

  const tc = project.taskCounts || {};
  const pct = tc.total > 0 ? Math.round((tc.done / tc.total) * 100) : 0;

  return (
    <div>
      {/* Project Header */}
      <div className="project-detail-header">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h1>{project.name}</h1>
            <p>{project.description || "No description"}</p>
          </div>
          {isAdmin && (
            <button className="btn btn-danger btn-sm" onClick={handleDeleteProject}>Delete Project</button>
          )}
        </div>
        <div className="meta">
          <span className="meta-item">👥 {project.members?.length} members</span>
          <span className="meta-item">📋 {tc.total || 0} tasks</span>
          <span className="meta-item">✅ {pct}% complete</span>
          <span className="meta-item"><span className={`badge badge-${role}`}>{role}</span></span>
        </div>
        {tc.total > 0 && (
          <div className="project-progress" style={{ marginTop: "16px" }}>
            <div className="progress-bar-bg"><div className="progress-bar-fill" style={{ width: `${pct}%` }}></div></div>
          </div>
        )}
      </div>

      {/* Tasks Section */}
      <div className="detail-section">
        <div className="detail-section-header">
          <h2 className="section-title">📋 Tasks</h2>
          {isAdmin && (
            <button className="btn btn-primary btn-sm" onClick={() => { setEditingTask(null); setTaskForm(emptyTask); setError(""); setShowTaskModal(true); }}>
              + Add Task
            </button>
          )}
        </div>

        <div className="task-filters">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="todo">To Do</option>
            <option value="in-progress">In Progress</option>
            <option value="done">Done</option>
          </select>
          <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
            <option value="">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>

        {tasks.length === 0 ? (
          <div className="empty-state"><div className="empty-icon">📝</div><h3>No tasks found</h3><p>{isAdmin ? "Add tasks to get started" : "No tasks match your filters"}</p></div>
        ) : (
          <div className="tasks-list">
            {tasks.map((task) => (
              <div className="task-item" key={task._id}>
                <div className="task-main">
                  <div className="task-title">{task.title}</div>
                  <div className="task-sub">
                    {task.assignee && <span>👤 {task.assignee.name}</span>}
                    {task.dueDate && (
                      <span style={{ color: isOverdue(task.dueDate, task.status) ? "var(--accent-rose)" : "inherit" }}>
                        📅 {formatDate(task.dueDate)} {isOverdue(task.dueDate, task.status) ? "(overdue)" : ""}
                      </span>
                    )}
                  </div>
                </div>
                <div className="task-badges">
                  <span className={`badge badge-${task.status}`}>{task.status}</span>
                  <span className={`badge badge-${task.priority}`}>{task.priority}</span>
                </div>
                <div className="task-actions">
                  <select value={task.status} onChange={(e) => handleStatusChange(task._id, e.target.value)}
                    style={{ padding: "4px 8px", background: "var(--bg-secondary)", color: "var(--text-primary)", border: "1px solid var(--border-glass)", borderRadius: "var(--radius-sm)", fontSize: "0.75rem" }}>
                    <option value="todo">To Do</option>
                    <option value="in-progress">In Progress</option>
                    <option value="done">Done</option>
                  </select>
                  {isAdmin && (
                    <>
                      <button className="btn btn-secondary btn-sm" onClick={() => handleEditTask(task)}>Edit</button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDeleteTask(task._id)}>✕</button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Members Section */}
      <div className="detail-section">
        <div className="detail-section-header">
          <h2 className="section-title">👥 Members</h2>
          {isAdmin && (
            <button className="btn btn-primary btn-sm" onClick={() => { setError(""); setShowMemberModal(true); }}>
              + Add Member
            </button>
          )}
        </div>
        <div className="members-list">
          {project.members?.map((m) => {
            const initials = m.user?.name ? m.user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) : "?";
            return (
              <div className="member-item" key={m.user?._id}>
                <div className="member-info">
                  <div className="member-avatar">{initials}</div>
                  <div className="member-details">
                    <h4>{m.user?.name}</h4>
                    <p>{m.user?.email}</p>
                  </div>
                  <span className={`badge badge-${m.role}`}>{m.role}</span>
                </div>
                {isAdmin && m.user?._id !== project.owner?._id && m.user?._id !== user?._id && (
                  <button className="btn btn-danger btn-sm" onClick={() => handleRemoveMember(m.user._id)}>Remove</button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Task Modal */}
      <Modal isOpen={showTaskModal} onClose={() => setShowTaskModal(false)} title={editingTask ? "Edit Task" : "Add Task"}>
        <form onSubmit={handleTaskSubmit}>
          <div className="auth-form">
            <div className="form-group">
              <label>Title</label>
              <input type="text" value={taskForm.title} onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })} required minLength={2} />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea value={taskForm.description} onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Assignee</label>
              <select value={taskForm.assignee} onChange={(e) => setTaskForm({ ...taskForm, assignee: e.target.value })}>
                <option value="">Unassigned</option>
                {project.members?.map((m) => (
                  <option key={m.user?._id} value={m.user?._id}>{m.user?.name}</option>
                ))}
              </select>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div className="form-group">
                <label>Priority</label>
                <select value={taskForm.priority} onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div className="form-group">
                <label>Status</label>
                <select value={taskForm.status} onChange={(e) => setTaskForm({ ...taskForm, status: e.target.value })}>
                  <option value="todo">To Do</option>
                  <option value="in-progress">In Progress</option>
                  <option value="done">Done</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Due Date</label>
              <input type="date" value={taskForm.dueDate} onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })} />
            </div>
            {error && <p className="form-error">{error}</p>}
            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setShowTaskModal(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? "Saving..." : editingTask ? "Update Task" : "Create Task"}
              </button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Add Member Modal */}
      <Modal isOpen={showMemberModal} onClose={() => setShowMemberModal(false)} title="Add Member">
        <form onSubmit={handleAddMember}>
          <div className="auth-form">
            <div className="form-group">
              <label>Email Address</label>
              <input type="email" value={memberEmail} onChange={(e) => setMemberEmail(e.target.value)} placeholder="user@example.com" required />
            </div>
            <div className="form-group">
              <label>Role</label>
              <select value={memberRole} onChange={(e) => setMemberRoleForm(e.target.value)}>
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            {error && <p className="form-error">{error}</p>}
            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setShowMemberModal(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? "Adding..." : "Add Member"}
              </button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
