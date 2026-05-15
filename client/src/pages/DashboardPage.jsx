import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getDashboardStats } from "../services/api";

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardStats()
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading"><div className="spinner"></div></div>;

  if (!stats) return <div className="empty-state"><h3>Could not load dashboard</h3></div>;

  const { totalProjects, totalTasks, statusCounts, overdueCount, myTasks, recentTasks } = stats;
  const total = totalTasks || 1;

  return (
    <div>
      <div className="page-header">
        <h1>📊 Dashboard</h1>
      </div>

      <div className="stats-grid">
        <div className="stat-card" style={{ animationDelay: "0.05s" }}>
          <div className="stat-icon" style={{ background: "rgba(139,92,246,0.15)", color: "var(--accent-violet)" }}>📁</div>
          <div className="stat-value">{totalProjects}</div>
          <div className="stat-label">Projects</div>
        </div>
        <div className="stat-card" style={{ animationDelay: "0.1s" }}>
          <div className="stat-icon" style={{ background: "rgba(56,189,248,0.15)", color: "var(--accent-sky)" }}>✅</div>
          <div className="stat-value">{totalTasks}</div>
          <div className="stat-label">Total Tasks</div>
        </div>
        <div className="stat-card" style={{ animationDelay: "0.15s" }}>
          <div className="stat-icon" style={{ background: "rgba(245,158,11,0.15)", color: "var(--accent-amber)" }}>🔧</div>
          <div className="stat-value">{myTasks}</div>
          <div className="stat-label">My Open Tasks</div>
        </div>
        <div className="stat-card" style={{ animationDelay: "0.2s" }}>
          <div className="stat-icon" style={{ background: "rgba(244,63,94,0.15)", color: "var(--accent-rose)" }}>⚠️</div>
          <div className="stat-value">{overdueCount}</div>
          <div className="stat-label">Overdue</div>
        </div>
      </div>

      {totalTasks > 0 && (
        <>
          <div className="section-title">Task Status Distribution</div>
          <div className="status-chart">
            <div className="status-chart-bar todo" style={{ width: `${(statusCounts.todo / total) * 100}%` }}></div>
            <div className="status-chart-bar in-progress" style={{ width: `${(statusCounts["in-progress"] / total) * 100}%` }}></div>
            <div className="status-chart-bar done" style={{ width: `${(statusCounts.done / total) * 100}%` }}></div>
          </div>
          <div className="chart-legend">
            <div className="chart-legend-item"><div className="chart-legend-dot" style={{ background: "var(--accent-sky)" }}></div>To Do ({statusCounts.todo})</div>
            <div className="chart-legend-item"><div className="chart-legend-dot" style={{ background: "var(--accent-amber)" }}></div>In Progress ({statusCounts["in-progress"]})</div>
            <div className="chart-legend-item"><div className="chart-legend-dot" style={{ background: "var(--accent-emerald)" }}></div>Done ({statusCounts.done})</div>
          </div>
        </>
      )}

      <div className="section-title">🕐 Recent Tasks</div>
      {recentTasks.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <h3>No tasks yet</h3>
          <p>Create a project and add tasks to get started</p>
        </div>
      ) : (
        <div className="recent-tasks-list">
          {recentTasks.map((task) => (
            <Link to={`/projects/${task.project?._id}`} key={task._id} style={{ textDecoration: "none", color: "inherit" }}>
              <div className="recent-task-item">
                <div className="recent-task-info">
                  <h4>{task.title}</h4>
                  <p>{task.project?.name} {task.assignee ? `• ${task.assignee.name}` : ""}</p>
                </div>
                <div className="recent-task-meta">
                  <span className={`badge badge-${task.status}`}>{task.status}</span>
                  <span className={`badge badge-${task.priority}`}>{task.priority}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
