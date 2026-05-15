import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getProjects, createProject } from "../services/api";
import Modal from "../components/Modal";

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: "", description: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const fetchProjects = () => {
    getProjects()
      .then(setProjects)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(fetchProjects, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await createProject(form);
      setForm({ name: "", description: "" });
      setShowModal(false);
      fetchProjects();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="loading"><div className="spinner"></div></div>;

  return (
    <div>
      <div className="page-header">
        <h1>📁 Projects</h1>
        <button className="btn btn-primary" onClick={() => setShowModal(true)} id="new-project-btn">
          + New Project
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📂</div>
          <h3>No projects yet</h3>
          <p>Create your first project to start managing tasks</p>
        </div>
      ) : (
        <div className="projects-grid">
          {projects.map((project, i) => {
            const tc = project.taskCounts || { todo: 0, "in-progress": 0, done: 0, total: 0 };
            const pct = tc.total > 0 ? Math.round((tc.done / tc.total) * 100) : 0;
            return (
              <div className="project-card" key={project._id}
                style={{ animationDelay: `${i * 0.06}s` }}
                onClick={() => navigate(`/projects/${project._id}`)}
              >
                <h3>{project.name}</h3>
                <p className="project-desc">{project.description || "No description"}</p>
                <div className="project-card-footer">
                  <span className="members-count">👥 {project.members?.length || 0} members</span>
                  <span className="tasks-count">📋 {tc.total} tasks</span>
                </div>
                <div className="project-progress">
                  <div className="progress-bar-bg">
                    <div className="progress-bar-fill" style={{ width: `${pct}%` }}></div>
                  </div>
                  <div className="progress-label">{pct}% complete</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Create New Project">
        <form onSubmit={handleCreate}>
          <div className="auth-form">
            <div className="form-group">
              <label htmlFor="project-name">Project Name</label>
              <input id="project-name" type="text" value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })} required minLength={2} />
            </div>
            <div className="form-group">
              <label htmlFor="project-desc">Description (optional)</label>
              <textarea id="project-desc" value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            {error && <p className="form-error">{error}</p>}
            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? "Creating..." : "Create Project"}
              </button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
