const API_BASE = "/api";

async function request(endpoint, options = {}) {
  const token = localStorage.getItem("token");
  const headers = { "Content-Type": "application/json", ...options.headers };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.message || "Request failed");
  return data;
}

// Auth
export const signup = (body) => request("/auth/signup", { method: "POST", body: JSON.stringify(body) });
export const login = (body) => request("/auth/login", { method: "POST", body: JSON.stringify(body) });
export const getMe = () => request("/auth/me");

// Projects
export const getProjects = () => request("/projects");
export const getProject = (id) => request(`/projects/${id}`);
export const createProject = (body) => request("/projects", { method: "POST", body: JSON.stringify(body) });
export const updateProject = (id, body) => request(`/projects/${id}`, { method: "PUT", body: JSON.stringify(body) });
export const deleteProject = (id) => request(`/projects/${id}`, { method: "DELETE" });
export const addMember = (id, body) => request(`/projects/${id}/members`, { method: "POST", body: JSON.stringify(body) });
export const removeMember = (id, userId) => request(`/projects/${id}/members/${userId}`, { method: "DELETE" });

// Tasks
export const getTasks = (projectId, query = "") => request(`/projects/${projectId}/tasks${query ? `?${query}` : ""}`);
export const createTask = (projectId, body) => request(`/projects/${projectId}/tasks`, { method: "POST", body: JSON.stringify(body) });
export const updateTask = (projectId, taskId, body) => request(`/projects/${projectId}/tasks/${taskId}`, { method: "PUT", body: JSON.stringify(body) });
export const deleteTask = (projectId, taskId) => request(`/projects/${projectId}/tasks/${taskId}`, { method: "DELETE" });

// Dashboard
export const getDashboardStats = () => request("/dashboard/stats");
