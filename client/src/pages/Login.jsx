
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MessageCircle, Video } from "lucide-react";
import api from "../services/api";

function Login() {
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();

        setError("");
        setLoading(true);

        try {
            const response = await api.post("/auth/login", {
                email,
                password
            });

            localStorage.setItem("token", response.data.token);
            localStorage.setItem("user", JSON.stringify(response.data.user));

            navigate("/dashboard");

        } catch (error) {
            setError(
                error.response?.data?.message || "Login failed"
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-left">
                <div className="brand">
                    <MessageCircle size={30} />
                    <h2>Denden</h2>
                </div>

                <div className="welcome-content">
                    <h1>Connect Beyond Distance.</h1>
                    <p>
                        Stay close to the people who matter.
                        Chat, connect and video call from anywhere.
                    </p>

                    <div className="feature-icons">
                        <MessageCircle size={22} />
                        <Video size={22} />
                        <span>Chat. Connect. Communicate.</span>
                    </div>
                </div>

                <p className="copyright">
                    © 2026 Denden. All rights reserved.
                </p>
            </div>

            <div className="auth-right">
                <form className="auth-card" onSubmit={handleLogin}>
                    <h1>Welcome Back!</h1>

                    <p className="auth-subtitle">
                        Sign in to continue to your account.
                    </p>

                    {error && (
                        <p style={{ color: "red", marginBottom: "15px" }}>
                            {error}
                        </p>
                    )}

                    <label>Email Address</label>
                    <input
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />

                    <label>Password</label>
                    <input
                        type="password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />

                    <button
                        type="submit"
                        className="auth-button"
                        disabled={loading}
                    >
                        {loading ? "Signing In..." : "Sign In"}
                    </button>

                    <p className="auth-switch">
                        Don't have an account? <Link to="/register">Create Account</Link>
                    </p>
                </form>
            </div>
        </div>
    );
}

export default Login;
