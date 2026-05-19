"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./login.module.css";

type LoginResponse = { token: string };

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("1234");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (token) router.replace("/dashboard");
  }, [router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!username.trim()) {
      setError("Usuario requerido");
      setIsLoading(false);
      return;
    }
    if (!password.trim()) {
      setError("Contraseña requerida");
      setIsLoading(false);
      return;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        const contentType = res.headers.get("content-type");
        let errorMsg = "Error de autenticación";

        try {
          if (contentType?.includes("application/json")) {
            const data = await res.json();
            errorMsg = data.message || errorMsg;
          } else {
            const text = await res.text();
            errorMsg = text || errorMsg;
          }
        } catch {}
        
        throw new Error(errorMsg);
      }

      const data: LoginResponse = await res.json();
      if (!data.token) throw new Error("Token no recibido");

      localStorage.setItem("auth_token", data.token);
      router.replace("/dashboard");
    } catch (err: any) {
      const msg = err?.message || "Error desconocido";
      
      if (msg.includes("Failed to fetch") || err?.name === "AbortError") {
        setError("No se puede conectar al servidor. ¿Está corriendo en " + API_URL + "?");
      } else {
        setError(msg);
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.container}>
        {/* Gradiente de fondo */}
        <div className={styles.gradient}></div>

        <div className={styles.card}>
          {/* Logo / Branding */}
          <div className={styles.header}>
            <div className={styles.logo}>
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <path d="M8 16L14 22L24 10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <h1 className={styles.title}>BookFlow</h1>
              <p className={styles.subtitle}>Admin Login</p>
            </div>
          </div>

          {/* Formulario */}
          <form onSubmit={onSubmit} className={styles.form}>
            {/* Campo Usuario */}
            <div className={styles.field}>
              <label htmlFor="username" className={styles.label}>
                Usuario
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
                className={styles.input}
                placeholder="Ingresa tu usuario"
                autoComplete="username"
              />
            </div>

            {/* Campo Contraseña */}
            <div className={styles.field}>
              <label htmlFor="password" className={styles.label}>
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className={styles.input}
                placeholder="Ingresa tu contraseña"
                autoComplete="current-password"
              />
            </div>

            {/* Error */}
            {error && <div className={styles.error}>{error}</div>}

            {/* Botón Submit */}
            <button type="submit" disabled={isLoading} className={styles.button}>
              {isLoading ? (
                <>
                  <span className={styles.spinner}></span>
                  Autenticando...
                </>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M15 3H6a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3h9" />
                    <path d="M16 16l4-4m0 0l-4-4m4 4H9" />
                  </svg>
                  Acceder
                </>
              )}
            </button>

            {/* Divider */}
            <div className={styles.divider}></div>

            {/* Demo Info */}
            <div className={styles.demo}>
              <p className={styles.demoTitle}>Credenciales de Demo</p>
              <div className={styles.demoBox}>
                <div className={styles.demoCred}>
                  <span className={styles.demoLabel}>Usuario:</span>
                  <code className={styles.demoCode}>admin</code>
                </div>
                <div className={styles.demoCred}>
                  <span className={styles.demoLabel}>Contraseña:</span>
                  <code className={styles.demoCode}>1234</code>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Footer Info */}
        <div className={styles.footer}>
          <p>
            Conectando a <code className={styles.apiUrl}>{API_URL}</code>
          </p>
        </div>
      </div>
    </div>
  );
}
