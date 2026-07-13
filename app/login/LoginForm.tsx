"use client";

import { useState } from "react";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function submitLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
      });
      const body = await response.json();

      if (!response.ok) {
        throw new Error(body.message || "Login gagal.");
      }

      window.location.assign(body.data.redirectTo);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Login gagal.");
      setIsSubmitting(false);
    }
  }

  return (
    <form className="loginForm" onSubmit={submitLogin}>
      <label>
        <span>Email</span>
        <input
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="nama@naltech.id"
          required
        />
      </label>
      <label>
        <span>Password</span>
        <input
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Masukkan password"
          required
        />
      </label>
      {errorMessage ? <p className="loginError">{errorMessage}</p> : null}
      <button className="button buttonPrimary fullWidth" type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Memeriksa akun..." : "Masuk"}
      </button>
    </form>
  );
}
