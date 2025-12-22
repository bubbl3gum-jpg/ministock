// src/pages/RegisterPage.jsx
import React, { useState } from "react";
import { register } from "../api"; // adjust path if your api file is elsewhere
import "../BubbleBiz.css"; // only if you use this for styling

export default function RegisterPage({ onRegistered, onShowLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const data = await register({ email, password });
      // data should be whatever your backend returns
      onRegistered("Registration successful! Please log in.");
    } catch (err) {
      console.error(err);
      setError(err?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bubblebiz-page min-h-screen flex items-center justify-center px-4">
      <div className="bubblebiz-card w-full max-w-md">
        <h1 className="bubblebiz-title mb-2 text-center">MiniStock Register</h1>
        <p className="bubblebiz-subtitle mb-6 text-center">
          Create a new account
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label className="bubblebiz-label" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              className="bubblebiz-input w-full"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>

          {/* Password */}
          <div>
            <label className="bubblebiz-label" htmlFor="password">
              Enter password
            </label>
            <input
              id="password"
              type="password"
              className="bubblebiz-input w-full"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          {/* Confirm Password */}
          <div>
            <label className="bubblebiz-label" htmlFor="confirmPassword">
              Confirm new password
            </label>
            <input
              id="confirmPassword"
              type="password"
              className="bubblebiz-input w-full"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          {/* Error */}
          {error && (
            <div className="bubblebiz-error text-sm mt-1">
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            className="bubblebiz-button w-full mt-2"
            disabled={loading}
          >
            {loading ? "Registering..." : "Register"}
          </button>
        </form>

        {/* Back to Login */}
        <div className="mt-4 text-center">
          <button
            onClick={onShowLogin}
            className="text-blue-500 hover:underline"
          >
            Already have an account? Log in
          </button>
        </div>
      </div>
    </div>
  );
}