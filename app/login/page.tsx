"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./login.module.css";

type LoginResponse = { token: string };

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // States for 2FA flow
  const [show2fa, setShow2fa] = useState(false);
  const [tempToken, setTempToken] = useState<string | null>(null);
  const [twoFactorCode, setTwoFactorCode] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (token) router.replace("/dashboard");
  }, [router]);

  function toggleMode() {
    setIsRegistering(!isRegistering);
    setShow2fa(false);
    setTempToken(null);
    setTwoFactorCode("");
    setUsername("");
    setPassword("");
    setConfirmPassword("");
    setFullName("");
    setEmail("");
    setError(null);
    setSuccessMessage(null);
  }

  function handleBackToLogin() {
    setShow2fa(false);
    setTempToken(null);
    setTwoFactorCode("");
    setPassword("");
    setError(null);
    setSuccessMessage(null);
  }

  function validatePassword(pass: string): string | null {
    if (pass.length < 8) {
      return "La contraseña debe tener al menos 8 caracteres";
    }
    if (!/[A-Z]/.test(pass)) {
      return "La contraseña debe contener al menos una letra mayúscula";
    }
    if (!/\d/.test(pass)) {
      return "La contraseña debe contener al menos un número";
    }
    if (!/[^A-Za-z0-9]/.test(pass)) {
      return "La contraseña debe contener al menos un carácter especial";
    }
    return null;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    if (show2fa) {
      if (!twoFactorCode.trim()) {
        setError("El código es requerido");
        setIsLoading(false);
        return;
      }
      if (twoFactorCode.trim().length !== 6) {
        setError("El código debe tener exactamente 6 dígitos");
        setIsLoading(false);
        return;
      }
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        const res = await fetch(`${API_URL}/auth/verify-register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tempToken, code: twoFactorCode.trim() }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!res.ok) {
          const contentType = res.headers.get("content-type");
          let errorMsg = "Error en la confirmación del registro";

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

        await res.json();
        setSuccessMessage("Registro confirmado con éxito. Por favor, inicia sesión con tus credenciales.");
        setShow2fa(false);
        setIsRegistering(false);
        setTempToken(null);
        setTwoFactorCode("");
        setUsername("");
        setPassword("");
        setConfirmPassword("");
        setFullName("");
        setEmail("");
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
      return;
    }

    if (isRegistering) {
      if (!fullName.trim()) {
        setError("El nombre completo es requerido");
        setIsLoading(false);
        return;
      }
      if (!email.trim()) {
        setError("El correo electrónico es requerido");
        setIsLoading(false);
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        setError("El correo electrónico debe ser válido");
        setIsLoading(false);
        return;
      }
      if (!username.trim()) {
        setError("El nombre de usuario es requerido");
        setIsLoading(false);
        return;
      }
      if (!password.trim()) {
        setError("La contraseña es requerida");
        setIsLoading(false);
        return;
      }
      const passError = validatePassword(password);
      if (passError) {
        setError(passError);
        setIsLoading(false);
        return;
      }
      if (password !== confirmPassword) {
        setError("Las contraseñas no coinciden");
        setIsLoading(false);
        return;
      }

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        const res = await fetch(`${API_URL}/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fullName: fullName.trim(),
            email: email.trim(),
            username: username.trim(),
            password
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!res.ok) {
          const contentType = res.headers.get("content-type");
          let errorMsg = "Error en el registro";

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

        const data = await res.json();
        if (data.require2fa) {
          setTempToken(data.tempToken);
          setShow2fa(true);
          setSuccessMessage("Hemos enviado un código de confirmación a tu correo electrónico");
        } else {
          setSuccessMessage("Registro exitoso. Por favor inicia sesión.");
          setConfirmPassword("");
          setPassword("");
          setFullName("");
          setEmail("");
          setIsRegistering(false);
        }
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
      return;
    }

    // Login flow
    if (!username.trim()) {
      setError("Usuario o correo electrónico requerido");
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

      const data = await res.json();
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
              <p className={styles.subtitle}>
                {show2fa
                  ? "Verificación de Doble Factor"
                  : isRegistering
                  ? "Registro de Administrador"
                  : "Acceso de Administrador"}
              </p>
            </div>
          </div>

          {/* Formulario */}
          <form onSubmit={onSubmit} className={styles.form}>
            {show2fa ? (
              <>
                {/* Pantalla de 2FA */}
                <div className={styles.field}>
                  <label htmlFor="twoFactorCode" className={styles.label}>
                    Código de Seguridad
                  </label>
                  <input
                    id="twoFactorCode"
                    type="text"
                    maxLength={6}
                    value={twoFactorCode}
                    onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ""))}
                    disabled={isLoading}
                    className={styles.input}
                    placeholder="Código de 6 dígitos"
                    autoComplete="one-time-code"
                    style={{ textAlign: "center", fontSize: "22px", letterSpacing: "6px", fontWeight: "bold" }}
                  />
                  <p style={{ margin: "6px 0 0 0", color: "var(--text-muted)", fontSize: "12px", textAlign: "center", lineHeight: "1.4" }}>
                    Ingresa el código que acabamos de enviar a tu correo electrónico registrado.
                  </p>
                </div>

                {/* Error y Éxito */}
                {error && <div className={styles.error}>{error}</div>}
                {successMessage && <div className={styles.success}>{successMessage}</div>}

                {/* Botón Submit 2FA */}
                <button type="submit" disabled={isLoading} className={styles.button}>
                  {isLoading ? (
                    <>
                      <span className={styles.spinner}></span>
                      Verificando...
                    </>
                  ) : (
                    <>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      </svg>
                      Verificar Código
                    </>
                  )}
                </button>

                {/* Botón para volver al login o registro */}
                <div className={styles.toggleContainer}>
                  <button
                    type="button"
                    onClick={handleBackToLogin}
                    className={styles.toggleLink}
                    style={{ margin: 0 }}
                  >
                    {isRegistering ? "Volver al formulario de registro" : "Volver al inicio de sesión"}
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* Campo Nombre Completo - Solo en Registro */}
                {isRegistering && (
                  <div className={styles.field}>
                    <label htmlFor="fullName" className={styles.label}>
                      Nombre Completo
                    </label>
                    <input
                      id="fullName"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      disabled={isLoading}
                      className={styles.input}
                      placeholder="Ingresa tu nombre completo"
                    />
                  </div>
                )}

                {/* Campo Correo Electrónico - Solo en Registro */}
                {isRegistering && (
                  <div className={styles.field}>
                    <label htmlFor="email" className={styles.label}>
                      Correo Electrónico
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isLoading}
                      className={styles.input}
                      placeholder="Ingresa tu correo electrónico"
                    />
                  </div>
                )}

                {/* Campo Usuario */}
                <div className={styles.field}>
                  <label htmlFor="username" className={styles.label}>
                    {isRegistering ? "Usuario" : "Usuario o Correo"}
                  </label>
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={isLoading}
                    className={styles.input}
                    placeholder={isRegistering ? "Crea un usuario" : "Ingresa tu usuario o correo electrónico"}
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
                    placeholder={isRegistering ? "Crea tu contraseña (mín. 8 caracteres)" : "Ingresa tu contraseña"}
                    autoComplete={isRegistering ? "new-password" : "current-password"}
                  />
                  {isRegistering && (
                    <div className={styles.passwordRules}>
                      <p className={styles.rulesTitle}>Requisitos de la contraseña:</p>
                      <ul className={styles.rulesList}>
                        <li className={password.length >= 8 ? styles.ruleValid : styles.ruleInvalid}>
                          <span className={styles.ruleBullet}></span> 8 caracteres al menos
                        </li>
                        <li className={/[A-Z]/.test(password) ? styles.ruleValid : styles.ruleInvalid}>
                          <span className={styles.ruleBullet}></span> Al menos una letra mayúscula
                        </li>
                        <li className={/\d/.test(password) ? styles.ruleValid : styles.ruleInvalid}>
                          <span className={styles.ruleBullet}></span> Al menos un número
                        </li>
                        <li className={/[^A-Za-z0-9]/.test(password) ? styles.ruleValid : styles.ruleInvalid}>
                          <span className={styles.ruleBullet}></span> Al menos un carácter especial
                        </li>
                      </ul>
                    </div>
                  )}
                </div>

                {/* Campo Confirmar Contraseña - Solo en Registro */}
                {isRegistering && (
                  <div className={styles.field}>
                    <label htmlFor="confirmPassword" className={styles.label}>
                      Confirmar Contraseña
                    </label>
                    <input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={isLoading}
                      className={styles.input}
                      placeholder="Confirma tu contraseña"
                      autoComplete="new-password"
                    />
                  </div>
                )}

                {/* Error y Éxito */}
                {error && <div className={styles.error}>{error}</div>}
                {successMessage && <div className={styles.success}>{successMessage}</div>}

                {/* Botón Submit */}
                <button type="submit" disabled={isLoading} className={styles.button}>
                  {isLoading ? (
                    <>
                      <span className={styles.spinner}></span>
                      {isRegistering ? "Registrando..." : "Autenticando..."}
                    </>
                  ) : (
                    <>
                      {isRegistering ? (
                        <>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <line x1="19" y1="8" x2="19" y2="14" />
                            <line x1="22" y1="11" x2="16" y2="11" />
                          </svg>
                          Registrarse
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
                    </>
                  )}
                </button>

                {/* Alternar modo */}
                <div className={styles.toggleContainer}>
                  {isRegistering ? (
                    <>
                      ¿Ya tienes cuenta?
                      <button
                        type="button"
                        onClick={toggleMode}
                        className={styles.toggleLink}
                      >
                        Inicia sesión
                      </button>
                    </>
                  ) : (
                    <>
                      ¿Nuevo usuario?
                      <button
                        type="button"
                        onClick={toggleMode}
                        className={styles.toggleLink}
                      >
                        Crea una cuenta
                      </button>
                    </>
                  )}
                </div>
              </>
            )}

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
