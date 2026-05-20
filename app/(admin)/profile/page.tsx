"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getProfile, updateProfile, UserProfile } from "@/lib/api";
import { motion } from "framer-motion";
import { User, Shield, LogOut, Key, CheckCircle, AlertCircle, RefreshCw } from "lucide-react";
import AdminProtected from "../admin-protected";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
};
export default function ProfilePage() {
  return (
    <AdminProtected>
      <ProfileContent />
    </AdminProtected>
  );
}

function ProfileContent() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Username Form
  const [username, setUsername] = useState("");
  const [usernameLoading, setUsernameLoading] = useState(false);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [usernameSuccess, setUsernameSuccess] = useState(false);

  // Password Form
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  async function fetchProfile() {
    try {
      setLoading(true);
      const data = await getProfile();
      setProfile(data);
      setUsername(data.username);
    } catch (err: any) {
      console.error("Error fetching profile:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateUsername(e: React.FormEvent) {
    e.preventDefault();
    setUsernameError(null);
    setUsernameSuccess(false);

    if (!username.trim()) {
      setUsernameError("El nombre de usuario no puede estar vacío");
      return;
    }

    try {
      setUsernameLoading(true);
      await updateProfile({ username: username.trim() });
      setUsernameSuccess(true);
      if (profile) {
        setProfile({ ...profile, username: username.trim() });
      }
      setTimeout(() => setUsernameSuccess(false), 4000);
    } catch (err: any) {
      setUsernameError(err?.message || "Error al actualizar el usuario");
    } finally {
      setUsernameLoading(false);
    }
  }

  async function handleUpdatePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);

    if (!password) {
      setPasswordError("La contraseña no puede estar vacía");
      return;
    }

    if (password.length < 4) {
      setPasswordError("La contraseña debe tener al menos 4 caracteres");
      return;
    }

    if (password !== confirmPassword) {
      setPasswordError("Las contraseñas no coinciden");
      return;
    }

    try {
      setPasswordLoading(true);
      await updateProfile({ password });
      setPasswordSuccess(true);
      setPassword("");
      setConfirmPassword("");
      setTimeout(() => setPasswordSuccess(false), 4000);
    } catch (err: any) {
      setPasswordError(err?.message || "Error al actualizar la contraseña");
    } finally {
      setPasswordLoading(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem("auth_token");
    router.replace("/login");
  }

  if (loading) {
    return (
      <div style={{ padding: "80px 40px", textAlign: "center", color: "var(--text-muted)" }}>
        <RefreshCw className="spinner" size={32} style={{ margin: "0 auto 16px", animation: "spin 1.5s linear infinite" }} />
        <p>Cargando información del perfil...</p>
      </div>
    );
  }

  const initialLetter = profile?.username ? profile.username.charAt(0).toUpperCase() : "A";

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="page-stack"
      style={{ maxWidth: "800px", margin: "0 auto", padding: "10px" }}
    >
      {/* Hero Section */}
      <motion.section variants={itemVariants} className="page-hero" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2>Mi Perfil</h2>
          <p>Gestiona tus credenciales de acceso y mantén tu cuenta segura.</p>
        </div>
        <button
          onClick={handleLogout}
          className="primary-btn"
          style={{
            background: "linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)",
            borderColor: "rgba(244, 63, 94, 0.4)",
            boxShadow: "0 4px 16px rgba(244, 63, 94, 0.2)",
          }}
        >
          <LogOut size={18} />
          <span>Cerrar Sesión</span>
        </button>
      </motion.section>

      {/* Main Grid Layout */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "24px", marginTop: "12px" }}>
        
        {/* Info Box Card (Header Style) */}
        <motion.div
          variants={itemVariants}
          className="section-card"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "24px",
            background: "linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(168, 85, 247, 0.03) 100%)",
            borderColor: "rgba(99, 102, 241, 0.2)",
            padding: "24px",
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              width: "72px",
              height: "72px",
              borderRadius: "50%",
              background: "var(--primary-gradient)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
              fontSize: "30px",
              fontWeight: 700,
              boxShadow: "0 8px 24px rgba(99, 102, 241, 0.3)",
            }}
          >
            {initialLetter}
          </div>
          <div style={{ flex: 1, minWidth: "200px" }}>
            <h3 style={{ margin: 0, fontSize: "20px", fontWeight: 700 }}>{profile?.username}</h3>
            <p style={{ margin: "4px 0 0 0", color: "var(--text-muted)", fontSize: "14px", display: "flex", alignItems: "center", gap: "6px" }}>
              <Shield size={14} style={{ color: "var(--primary)" }} /> Cuenta Administrador Principal
            </p>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <div style={{ padding: "8px 14px", background: "rgba(255,255,255,0.05)", borderRadius: "8px", border: "1px solid var(--border)" }}>
              <span style={{ display: "block", fontSize: "11px", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase" }}>ID Base Datos</span>
              <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--primary)" }}>#{profile?.id}</span>
            </div>
          </div>
        </motion.div>

        {/* Change Credentials Panels */}
        <div style={{ display: "grid", gridTemplateColumns: "window.innerWidth > 768 ? '1fr 1fr' : '1fr'", gap: "24px" }} className="responsive-profile-grid">
          
          {/* Change Username Panel */}
          <motion.div variants={itemVariants} className="section-card" style={{ display: "flex", flexDirection: "column", height: "100%" }}>
            <div className="panel-title-row" style={{ marginBottom: "20px" }}>
              <h3 className="panel-title" style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "16px" }}>
                <User size={18} style={{ color: "var(--primary)" }} /> Cambiar Usuario
              </h3>
            </div>
            
            <form onSubmit={handleUpdateUsername} style={{ display: "flex", flexDirection: "column", gap: "16px", flex: 1 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label style={{ fontSize: "12px", fontWeight: 600, textTransform: "uppercase", color: "var(--text-muted)", letterSpacing: "0.5px" }}>
                  Nombre de Usuario
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={usernameLoading}
                  style={{
                    padding: "12px 14px",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    background: "rgba(255, 255, 255, 0.02)",
                    color: "var(--text)",
                    fontSize: "14px",
                    fontWeight: 500,
                  }}
                  placeholder="Nuevo nombre de usuario"
                />
              </div>

              {/* Feedbacks */}
              {usernameError && (
                <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 12px", background: "rgba(244, 63, 94, 0.1)", border: "1px solid rgba(244, 63, 94, 0.3)", borderRadius: "8px", color: "#f43f5e", fontSize: "13px" }}>
                  <AlertCircle size={16} />
                  <span>{usernameError}</span>
                </div>
              )}

              {usernameSuccess && (
                <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 12px", background: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.3)", borderRadius: "8px", color: "#10b981", fontSize: "13px" }}>
                  <CheckCircle size={16} />
                  <span>¡Usuario actualizado correctamente!</span>
                </div>
              )}

              <button
                type="submit"
                disabled={usernameLoading || username.trim() === profile?.username}
                className="primary-btn"
                style={{
                  marginTop: "auto",
                  padding: "12px",
                  fontSize: "14px",
                  width: "100%",
                  justifyContent: "center",
                  opacity: username.trim() === profile?.username ? 0.6 : 1,
                  cursor: username.trim() === profile?.username ? "not-allowed" : "pointer"
                }}
              >
                {usernameLoading ? "Guardando..." : "Guardar Cambios"}
              </button>
            </form>
          </motion.div>

          {/* Change Password Panel */}
          <motion.div variants={itemVariants} className="section-card" style={{ display: "flex", flexDirection: "column" }}>
            <div className="panel-title-row" style={{ marginBottom: "20px" }}>
              <h3 className="panel-title" style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "16px" }}>
                <Key size={18} style={{ color: "var(--primary)" }} /> Cambiar Contraseña
              </h3>
            </div>

            <form onSubmit={handleUpdatePassword} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label style={{ fontSize: "12px", fontWeight: 600, textTransform: "uppercase", color: "var(--text-muted)", letterSpacing: "0.5px" }}>
                  Nueva Contraseña
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={passwordLoading}
                  style={{
                    padding: "12px 14px",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    background: "rgba(255, 255, 255, 0.02)",
                    color: "var(--text)",
                    fontSize: "14px",
                    fontWeight: 500,
                  }}
                  placeholder="Mínimo 4 caracteres"
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label style={{ fontSize: "12px", fontWeight: 600, textTransform: "uppercase", color: "var(--text-muted)", letterSpacing: "0.5px" }}>
                  Confirmar Contraseña
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={passwordLoading}
                  style={{
                    padding: "12px 14px",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    background: "rgba(255, 255, 255, 0.02)",
                    color: "var(--text)",
                    fontSize: "14px",
                    fontWeight: 500,
                  }}
                  placeholder="Repite la contraseña"
                />
              </div>

              {/* Feedbacks */}
              {passwordError && (
                <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 12px", background: "rgba(244, 63, 94, 0.1)", border: "1px solid rgba(244, 63, 94, 0.3)", borderRadius: "8px", color: "#f43f5e", fontSize: "13px" }}>
                  <AlertCircle size={16} />
                  <span>{passwordError}</span>
                </div>
              )}

              {passwordSuccess && (
                <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 12px", background: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.3)", borderRadius: "8px", color: "#10b981", fontSize: "13px" }}>
                  <CheckCircle size={16} />
                  <span>¡Contraseña actualizada correctamente!</span>
                </div>
              )}

              <button
                type="submit"
                disabled={passwordLoading || !password || !confirmPassword}
                className="primary-btn"
                style={{
                  padding: "12px",
                  fontSize: "14px",
                  width: "100%",
                  justifyContent: "center",
                  opacity: (!password || !confirmPassword) ? 0.6 : 1,
                  cursor: (!password || !confirmPassword) ? "not-allowed" : "pointer"
                }}
              >
                {passwordLoading ? "Actualizando..." : "Actualizar Contraseña"}
              </button>
            </form>
          </motion.div>

        </div>
      </div>
      
      {/* Responsive adjustments helper */}
      <style jsx global>{`
        @media (max-width: 768px) {
          .responsive-profile-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </motion.div>
  );
}
