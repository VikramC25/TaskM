import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { login, signup } from "../services/api";

export default function AuthPage({ mode = "login" }) {
  const isLogin = mode === "login";
  const { loginUser } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = isLogin
        ? await login({ email: form.email, password: form.password })
        : await signup(form);
      loginUser(data.token, data.user);
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>{isLogin ? "Welcome back" : "Create account"}</h1>
        <p className="subtitle">
          {isLogin ? "Sign in to manage your projects" : "Get started with TaskM today"}
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="form-group">
              <label htmlFor="auth-name">Full Name</label>
              <input id="auth-name" name="name" type="text" placeholder="John Doe"
                value={form.name} onChange={handleChange} required={!isLogin} />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="auth-email">Email</label>
            <input id="auth-email" name="email" type="email" placeholder="you@example.com"
              value={form.email} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label htmlFor="auth-password">Password</label>
            <input id="auth-password" name="password" type="password" placeholder="••••••••"
              value={form.password} onChange={handleChange} required minLength={6} />
          </div>

          {error && <p className="form-error">{error}</p>}

          <button className="btn btn-primary" type="submit" disabled={loading} id="auth-submit-btn">
            {loading ? "Please wait..." : isLogin ? "Sign In" : "Create Account"}
          </button>
        </form>

        <div className="auth-toggle">
          {isLogin ? (
            <>Don't have an account? <Link to="/signup">Sign up</Link></>
          ) : (
            <>Already have an account? <Link to="/login">Sign in</Link></>
          )}
        </div>
      </div>
    </div>
  );
}
