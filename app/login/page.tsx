"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./login.module.css";
import { ShieldAlert, CheckCircle, ArrowRight, Clock, Scissors } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export default function LoginPage() {
  const router = useRouter();
  
  // Roles: "client" | "business" | "superadmin"
  const [role, setRole] = useState<"client" | "business" | "superadmin">("client");
  
  // Mode: login or register
  const [isRegistering, setIsRegistering] = useState(false);
  const [show2fa, setShow2fa] = useState(false);
  const [tempToken, setTempToken] = useState<string | null>(null);
  const [twoFactorCode, setTwoFactorCode] = useState("");
  
  // Shared fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Client registration fields
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatar, setAvatar] = useState("");

  // Business registration fields
  const [businessName, setBusinessName] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [category, setCategory] = useState("Estética");

  // Onboarding States
  const [isOnboarding, setIsOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [openingHours, setOpeningHours] = useState({
    monFri: "09:00 - 18:00",
    sat: "09:00 - 14:00",
    sun: "Cerrado"
  });
  const [services, setServices] = useState([
    { name: "Corte de Pelo Express", duration: 30, price: 15 },
    { name: "Lavado & Peinado Premium", duration: 45, price: 25 },
    { name: "Tratamiento Hidratante", duration: 60, price: 40 }
  ]);

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
    setPhone("");
    setBusinessName("");
    setStreet("");
    setCity("");
    setZipCode("");
    setError(null);
    setSuccessMessage(null);
    setIsOnboarding(false);
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
    return null;
  }

  const handleDemoLogin = async (selectedRole: "client" | "business" | "superadmin") => {
    setIsLoading(true);
    setError(null);
    let demoUser = "client1";
    let demoPass = "client123!";
    
    if (selectedRole === "business") {
      demoUser = "owner1";
      demoPass = "owner123!";
    } else if (selectedRole === "superadmin") {
      demoUser = "admin";
      demoPass = "admin";
    }

    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: demoUser, password: demoPass }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Error en login de demo");
      }
      localStorage.setItem("auth_token", data.token);
      localStorage.setItem("user_role", data.user.role);
      localStorage.setItem("user_name", data.user.fullName);
      router.replace("/dashboard");
    } catch (err: any) {
      setError("Error al conectar con la API de BookFlow: " + err.message);
      setIsLoading(false);
    }
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    if (isRegistering) {
      const isClientRole = role === "client";
      const nameToUse = isClientRole ? fullName : businessName;
      const usernameToUse = isClientRole ? username : email.split("@")[0] + "_" + Date.now().toString().slice(-4);

      if (!nameToUse.trim() || !email.trim() || !password.trim()) {
        setError("Por favor, completa todos los campos requeridos");
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
        const res = await fetch(`${API_URL}/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fullName: nameToUse.trim(),
            email: email.trim(),
            username: usernameToUse.trim(),
            password: password,
            role: role,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || "Error al registrarse");
        }

        if (data.require2fa) {
          setTempToken(data.tempToken);
          setShow2fa(true);
          setSuccessMessage("Código de verificación 2FA enviado al correo (Simulado: Mira la terminal de NestJS)");
        } else {
          setSuccessMessage("Registro completado. Por favor, inicia sesión.");
          setIsRegistering(false);
        }
      } catch (err: any) {
        setError(err.message || "Error en el registro");
      } finally {
        setIsLoading(false);
      }
    } else {
      if (!email.trim() || !password.trim()) {
        setError("El correo/usuario y contraseña son obligatorios");
        setIsLoading(false);
        return;
      }

      try {
        const res = await fetch(`${API_URL}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: email.trim(),
            password: password,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || "Credenciales incorrectas");
        }

        localStorage.setItem("auth_token", data.token);
        localStorage.setItem("user_role", data.user.role);
        localStorage.setItem("user_name", data.user.fullName);
        router.replace("/dashboard");
      } catch (err: any) {
        setError(err.message || "Error al iniciar sesión");
        setIsLoading(false);
      }
    }
  }

  const handleOnboardingSubmit = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) throw new Error("Falta token de sesión");

      const bizRes = await fetch(`${API_URL}/businesses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: businessName,
          category,
          street,
          city,
          zipCode,
          phone,
          email,
          image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1000&auto=format&fit=crop&q=80",
          logo: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=200&auto=format&fit=crop&q=80",
          hours: JSON.stringify(openingHours),
          gallery: JSON.stringify([]),
        }),
      });

      const business = await bizRes.json();
      if (!bizRes.ok) {
        throw new Error(business.message || "Error al crear el negocio");
      }

      for (const s of services) {
        const sRes = await fetch(`${API_URL}/services`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: s.name,
            duration: s.duration,
            price: s.price,
            businessId: business.id,
          }),
        });
        if (!sRes.ok) {
          console.error("Error creating onboarding service", s.name);
        }
      }

      setIsOnboarding(false);
      router.replace("/dashboard");
    } catch (err: any) {
      setError(err.message || "Error en configuración inicial");
    } finally {
      setIsLoading(false);
    }
  };

  const handle2faVerify = async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (!tempToken) throw new Error("Falta token temporal");
      
      const res = await fetch(`${API_URL}/auth/verify-register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tempToken: tempToken,
          code: twoFactorCode,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Código incorrecto");
      }

      const loginRes = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: email.trim(),
          password: password,
        }),
      });

      const loginData = await loginRes.json();
      if (!loginRes.ok) {
        throw new Error(loginData.message || "Error al iniciar sesión tras confirmación");
      }

      localStorage.setItem("auth_token", loginData.token);
      localStorage.setItem("user_role", loginData.user.role);
      localStorage.setItem("user_name", loginData.user.fullName);

      setShow2fa(false);
      setSuccessMessage(null);

      if (loginData.user.role === "business") {
        setIsOnboarding(true);
      } else {
        router.replace("/dashboard");
      }
    } catch (err: any) {
      setError(err.message || "Error al verificar código");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.container}>
        <div className={styles.gradient}></div>

        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className={styles.card}
          style={{ backdropFilter: "blur(16px)", background: "rgba(23, 25, 30, 0.75)" }}
        >
          {isOnboarding ? (
            /* ONBOARDING FLOW */
            <div>
              <div style={{ textAlign: "center", marginBottom: "24px" }}>
                <h2 className={styles.title} style={{ background: "var(--primary-gradient)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  ¡Bienvenido a BookFlow!
                </h2>
                <p className={styles.subtitle}>Configura tu negocio en solo 2 sencillos pasos</p>
                
                {/* Visual Stepper */}
                <div style={{ display: "flex", justifyContent: "center", gap: "12px", marginTop: "16px" }}>
                  <div style={{ width: "40px", height: "4px", background: "var(--primary)", borderRadius: "2px" }} />
                  <div style={{ width: "40px", height: "4px", background: onboardingStep === 2 ? "var(--primary)" : "var(--border)", borderRadius: "2px", transition: "background 0.3s" }} />
                </div>
              </div>

              {onboardingStep === 1 ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <div className={styles.field} style={{ marginBottom: "16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                      <Clock size={18} style={{ color: "var(--primary)" }} />
                      <span className={styles.label}>Paso 1: Horarios de Apertura</span>
                    </div>
                    
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      <div>
                        <label style={{ fontSize: "12px", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>Lunes a Viernes</label>
                        <input className={styles.input} value={openingHours.monFri} onChange={(e) => setOpeningHours({...openingHours, monFri: e.target.value})} />
                      </div>
                      <div>
                        <label style={{ fontSize: "12px", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>Sábados</label>
                        <input className={styles.input} value={openingHours.sat} onChange={(e) => setOpeningHours({...openingHours, sat: e.target.value})} />
                      </div>
                      <div>
                        <label style={{ fontSize: "12px", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>Domingos</label>
                        <input className={styles.input} value={openingHours.sun} onChange={(e) => setOpeningHours({...openingHours, sun: e.target.value})} />
                      </div>
                    </div>
                  </div>

                  <button 
                    type="button" 
                    className={styles.button} 
                    style={{ width: "100%" }}
                    onClick={() => setOnboardingStep(2)}
                  >
                    <span>Continuar</span>
                    <ArrowRight size={16} />
                  </button>
                </motion.div>
              ) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <div className={styles.field} style={{ marginBottom: "16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                      <Scissors size={18} style={{ color: "var(--primary)" }} />
                      <span className={styles.label}>Paso 2: Servicios Iniciales</span>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "200px", overflowY: "auto", paddingRight: "4px" }}>
                      {services.map((service, index) => (
                        <div key={index} style={{ background: "rgba(255,255,255,0.03)", padding: "10px", borderRadius: "8px", border: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div>
                            <p style={{ margin: 0, fontSize: "13px", fontWeight: "bold" }}>{service.name}</p>
                            <p style={{ margin: 0, fontSize: "11px", color: "var(--text-muted)" }}>{service.duration} mins</p>
                          </div>
                          <span style={{ fontSize: "13px", color: "var(--primary)", fontWeight: "bold" }}>{service.price} €</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button 
                    type="button" 
                    disabled={isLoading} 
                    className={styles.button} 
                    style={{ width: "100%", background: "var(--success)" }}
                    onClick={handleOnboardingSubmit}
                  >
                    {isLoading ? "Guardando Configuración..." : "¡Finalizar y Entrar!"}
                  </button>
                </motion.div>
              )}
            </div>
          ) : show2fa ? (
            /* 2FA VERIFICATION CODE SCREEN */
            <div>
              <div className={styles.header}>
                <div className={styles.logo}>🔒</div>
                <div>
                  <h1 className={styles.title}>Confirmación 2FA</h1>
                  <p className={styles.subtitle}>Verificación de Seguridad</p>
                </div>
              </div>

              <div className={styles.field} style={{ marginBottom: "16px" }}>
                <label className={styles.label}>Código de 6 dígitos</label>
                <input
                  type="text"
                  maxLength={6}
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ""))}
                  className={styles.input}
                  placeholder="Código de verificación"
                  style={{ textAlign: "center", fontSize: "20px", letterSpacing: "4px", fontWeight: "bold" }}
                />
                <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "6px", textAlign: "center" }}>
                  Introduce el código simulado <strong>123456</strong> para continuar.
                </p>
              </div>

              {error && <div className={styles.error}>{error}</div>}
              {successMessage && <div className={styles.success} style={{ display: "flex", gap: "8px", alignItems: "center" }}><CheckCircle size={16} /> {successMessage}</div>}

              <button 
                type="button" 
                disabled={isLoading} 
                onClick={handle2faVerify} 
                className={styles.button} 
                style={{ width: "100%" }}
              >
                {isLoading ? "Verificando..." : "Confirmar Código"}
              </button>
            </div>
          ) : (
            /* DEFAULT SIGN IN & SIGN UP FORM */
            <>
              {/* Logo & Header */}
              <div className={styles.header}>
                <div className={styles.logo}>
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                    <path d="M8 16L14 22L24 10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div>
                  <h1 className={styles.title}>BookFlow</h1>
                  <p className={styles.subtitle}>
                    {role === "superadmin"
                      ? "Consola de Superadmin"
                      : isRegistering
                      ? "Crea tu Cuenta Premium"
                      : "Acceso al Sistema"}
                  </p>
                </div>
              </div>

              {/* Dynamic Role Tab Selector */}
              {!isRegistering && role !== "superadmin" && (
                <div style={{ display: "flex", background: "rgba(255,255,255,0.03)", padding: "4px", borderRadius: "12px", border: "1px solid var(--border)", marginBottom: "20px" }}>
                  <button 
                    type="button" 
                    onClick={() => setRole("client")}
                    style={{ flex: 1, padding: "8px 12px", border: "none", borderRadius: "8px", background: role === "client" ? "var(--primary-gradient)" : "transparent", color: "white", fontSize: "13px", fontWeight: "bold", cursor: "pointer", transition: "all 0.3s" }}
                  >
                    Soy Cliente
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setRole("business")}
                    style={{ flex: 1, padding: "8px 12px", border: "none", borderRadius: "8px", background: role === "business" ? "var(--primary-gradient)" : "transparent", color: "white", fontSize: "13px", fontWeight: "bold", cursor: "pointer", transition: "all 0.3s" }}
                  >
                    Soy Empresa
                  </button>
                </div>
              )}

              {/* Registration Role Selector */}
              {isRegistering && (
                <div style={{ display: "flex", background: "rgba(255,255,255,0.03)", padding: "4px", borderRadius: "12px", border: "1px solid var(--border)", marginBottom: "20px" }}>
                  <button 
                    type="button" 
                    onClick={() => setRole("client")}
                    style={{ flex: 1, padding: "8px 12px", border: "none", borderRadius: "8px", background: role === "client" ? "var(--primary-gradient)" : "transparent", color: "white", fontSize: "13px", fontWeight: "bold", cursor: "pointer", transition: "all 0.3s" }}
                  >
                    Registro Cliente
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setRole("business")}
                    style={{ flex: 1, padding: "8px 12px", border: "none", borderRadius: "8px", background: role === "business" ? "var(--primary-gradient)" : "transparent", color: "white", fontSize: "13px", fontWeight: "bold", cursor: "pointer", transition: "all 0.3s" }}
                  >
                    Registro Empresa
                  </button>
                </div>
              )}

              {/* Form */}
              <form onSubmit={onSubmit} className={styles.form}>
                {isRegistering ? (
                  /* REGISTRATION FIELDS */
                  <>
                    {role === "client" ? (
                      /* CLIENT REGISTRATION */
                      <>
                        <div className={styles.field}>
                          <label className={styles.label}>Nombre Completo</label>
                          <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className={styles.input} placeholder="Tu nombre y apellidos" />
                        </div>
                        <div className={styles.field}>
                          <label className={styles.label}>Nombre de Usuario</label>
                          <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className={styles.input} placeholder="Tu alias único" />
                        </div>
                        <div className={styles.field}>
                          <label className={styles.label}>Teléfono</label>
                          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={styles.input} placeholder="Tu número de teléfono" />
                        </div>
                      </>
                    ) : (
                      /* BUSINESS REGISTRATION */
                      <>
                        <div className={styles.field}>
                          <label className={styles.label}>Nombre Comercial del Negocio</label>
                          <input type="text" value={businessName} onChange={(e) => setBusinessName(e.target.value)} className={styles.input} placeholder="Ej. Peluquería Alicante S.L." />
                        </div>
                        <div className={styles.field}>
                          <label className={styles.label}>Categoría</label>
                          <select value={category} onChange={(e) => setCategory(e.target.value)} className={styles.input}>
                            <option value="Estética">Peluquería y Estética</option>
                            <option value="Salud">Salud y Fisioterapia</option>
                            <option value="Bienestar">Spa y Masajes</option>
                            <option value="Otros">Otros Servicios</option>
                          </select>
                        </div>
                        <div className={styles.field}>
                          <label className={styles.label}>Dirección Completa</label>
                          <input type="text" value={street} onChange={(e) => setStreet(e.target.value)} className={styles.input} placeholder="Calle y número" style={{ marginBottom: "6px" }} />
                          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "8px" }}>
                            <input type="text" value={city} onChange={(e) => setCity(e.target.value)} className={styles.input} placeholder="Ciudad" />
                            <input type="text" value={zipCode} onChange={(e) => setZipCode(e.target.value)} className={styles.input} placeholder="C.P." />
                          </div>
                        </div>
                      </>
                    )}

                    <div className={styles.field}>
                      <label className={styles.label}>Correo Electrónico</label>
                      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={styles.input} placeholder="correo@ejemplo.com" />
                    </div>

                    <div className={styles.field}>
                      <label className={styles.label}>Contraseña</label>
                      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={styles.input} placeholder="Crea tu contraseña segura" />
                    </div>

                    <div className={styles.field}>
                      <label className={styles.label}>Confirmar Contraseña</label>
                      <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={styles.input} placeholder="Repite tu contraseña" />
                    </div>
                  </>
                ) : (
                  /* LOGIN FIELDS */
                  <>
                    <div className={styles.field}>
                      <label className={styles.label}>Correo Electrónico</label>
                      <input
                        type="text"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={styles.input}
                        placeholder={role === "superadmin" ? "Usuario del Sistema" : "Tu correo registrado"}
                      />
                    </div>

                    <div className={styles.field}>
                      <label className={styles.label}>Contraseña</label>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={styles.input}
                        placeholder="Contraseña"
                      />
                    </div>
                  </>
                )}

                {error && <div className={styles.error} style={{ display: "flex", gap: "8px", alignItems: "center" }}><ShieldAlert size={16} /> {error}</div>}
                {successMessage && <div className={styles.success}>{successMessage}</div>}

                {/* Login/Register Buttons */}
                <button type="submit" disabled={isLoading} className={styles.button} style={{ width: "100%" }}>
                  {isLoading ? (
                    <>
                      <span className={styles.spinner}></span>
                      Cargando...
                    </>
                  ) : isRegistering ? (
                    "Comenzar Registro"
                  ) : (
                    "Iniciar Sesión"
                  )}
                </button>

                {/* Form Mode Toggle */}
                <div className={styles.toggleContainer}>
                  {isRegistering ? (
                    <>
                      ¿Ya tienes una cuenta?
                      <button type="button" onClick={toggleMode} className={styles.toggleLink}>
                        Inicia Sesión
                      </button>
                    </>
                  ) : (
                    <>
                      ¿Nuevo en BookFlow?
                      <button type="button" onClick={toggleMode} className={styles.toggleLink}>
                        Crea una cuenta
                      </button>
                    </>
                  )}
                </div>

                <div className={styles.divider}></div>

                {/* DEMO / QUICK ACCESS LOGINS FOR EXTREMELY USER FRIENDLY WORKFLOW */}
                <div className={styles.demo}>
                  <p className={styles.demoTitle}>Acceso Rápido de Demostración</p>
                  <div className={styles.demoBox}>
                    <button 
                      type="button" 
                      onClick={() => handleDemoLogin("client")}
                      className="secondary-btn"
                      style={{ fontSize: "11px", display: "flex", justifyContent: "center", padding: "8px" }}
                    >
                      Demo Cliente
                    </button>
                    <button 
                      type="button" 
                      onClick={() => handleDemoLogin("business")}
                      className="secondary-btn"
                      style={{ fontSize: "11px", display: "flex", justifyContent: "center", padding: "8px" }}
                    >
                      Demo Empresa
                    </button>
                  </div>
                </div>

              </form>
            </>
          )}
        </motion.div>

        {/* Footer info & hidden superadmin link */}
        <div className={styles.footer} style={{ display: "flex", flexDirection: "column", gap: "10px", alignItems: "center" }}>
          <p>Conectado a la API Premium de BookFlow</p>
          <button 
            type="button" 
            onClick={() => {
              if (role === "superadmin") {
                setRole("client");
              } else {
                setRole("superadmin");
              }
              setIsRegistering(false);
            }}
            style={{ background: "none", border: "none", color: "var(--primary)", fontSize: "11px", fontWeight: "bold", textDecoration: "underline", cursor: "pointer" }}
          >
            {role === "superadmin" ? "Volver a la vista del cliente" : "Acceso de Superadmin de Plataforma"}
          </button>
        </div>
      </div>
    </div>
  );
}
