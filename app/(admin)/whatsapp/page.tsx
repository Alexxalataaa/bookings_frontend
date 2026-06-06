"use client";

import { useEffect, useRef, useState } from "react";
import { whatsappSimulate, getWhatsappSessions } from "@/lib/api";
import { MessageCircle, Send, Phone, RefreshCw, Wifi, WifiOff, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ChatMessage {
  from: "user" | "bot";
  text: string;
  time: string;
}

const DEMO_PHONE = "simulator_demo";

function now() {
  return new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
}

export default function WhatsappPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      from: "bot",
      text: "👋 ¡Hola! Soy el asistente de reservas de *Krono*.\n\nEscribe *hola* o *reservar* para comenzar a agendar tu cita. 🗓️",
      time: now(),
    },
  ]);
  const [inputMsg, setInputMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState<any[]>([]);
  const [sessionsLoading, setSessLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"simulator" | "sessions" | "config">("simulator");
  const [phoneId, setPhoneId] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [verifyToken, setVerifyToken] = useState("krono_verify_token_2024");
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchSessions = async () => {
    setSessLoading(true);
    try {
      const data = await getWhatsappSessions();
      setSessions(data || []);
    } catch {
      setSessions([]);
    } finally {
      setSessLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "sessions") fetchSessions();
  }, [activeTab]);

  const sendMessage = async (msg?: string) => {
    const text = (msg ?? inputMsg).trim();
    if (!text || loading) return;
    setInputMsg("");

    const userMsg: ChatMessage = { from: "user", text, time: now() };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const { reply } = await whatsappSimulate(DEMO_PHONE, text);
      const botMsg: ChatMessage = { from: "bot", text: reply, time: now() };
      setMessages(prev => [...prev, botMsg]);
    } catch {
      setMessages(prev => [...prev, { from: "bot", text: "⚠️ Error de conexión con el servidor.", time: now() }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const resetChat = async () => {
    // Send a reset signal to clear the session
    try { await whatsappSimulate(DEMO_PHONE, "exit"); } catch {}
    setMessages([{
      from: "bot",
      text: "👋 ¡Hola! Soy el asistente de reservas de *Krono*.\n\nEscribe *hola* o *reservar* para comenzar a agendar tu cita. 🗓️",
      time: now(),
    }]);
  };

  const QUICK_REPLIES = ["hola", "reservar", "sí", "cancelar"];

  const renderBubble = (msg: ChatMessage, idx: number) => {
    const isBot = msg.from === "bot";
    // Convert *bold* markdown to styled spans
    const formattedText = msg.text.split("\n").map((line, i) => (
      <span key={i} style={{ display: "block" }}>
        {line.split(/\*(.*?)\*/g).map((part, j) =>
          j % 2 === 1
            ? <strong key={j}>{part}</strong>
            : <span key={j}>{part}</span>
        )}
      </span>
    ));

    return (
      <motion.div
        key={idx}
        initial={{ opacity: 0, y: 10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.2 }}
        style={{
          display: "flex",
          justifyContent: isBot ? "flex-start" : "flex-end",
          marginBottom: "10px",
        }}
      >
        {isBot && (
          <div style={{
            width: "32px", height: "32px", borderRadius: "50%", flexShrink: 0,
            background: "linear-gradient(135deg, #25d366, #128c7e)", marginRight: "8px",
            display: "flex", alignItems: "center", justifyContent: "center",
            alignSelf: "flex-end",
          }}>
            <MessageCircle size={16} color="#fff" />
          </div>
        )}
        <div
          style={{
            maxWidth: "75%",
            background: isBot ? "#202c33" : "#005c4b",
            borderRadius: isBot ? "0 16px 16px 16px" : "16px 0 16px 16px",
            padding: "10px 14px",
            fontSize: "14px",
            lineHeight: 1.5,
            color: "#e9edef",
            boxShadow: "0 1px 2px rgba(0,0,0,0.3)",
          }}
        >
          {formattedText}
          <div style={{ fontSize: "11px", color: "rgba(233,237,239,0.5)", marginTop: "4px", textAlign: "right" }}>
            {msg.time}
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="page-stack">
      {/* Header */}
      <section className="page-hero">
        <div>
          <h2>Asistente WhatsApp</h2>
          <p>Gestiona el bot conversacional de reservas por WhatsApp. Prueba el flujo en el simulador integrado.</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 16px", borderRadius: "30px", background: "rgba(37,211,102,0.1)", border: "1px solid rgba(37,211,102,0.3)", fontSize: "13px", color: "#25d366", fontWeight: 700 }}>
          <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#25d366", boxShadow: "0 0 8px #25d366", animation: "pulse 2s infinite" }} />
          Bot activo
        </div>
      </section>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "4px", background: "rgba(255,255,255,0.03)", padding: "4px", borderRadius: "12px", border: "1px solid var(--border)", width: "fit-content" }}>
        {(["simulator", "sessions", "config"] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: "8px 20px", borderRadius: "8px", border: "none", cursor: "pointer",
              background: activeTab === tab ? "var(--primary)" : "transparent",
              color: activeTab === tab ? "#fff" : "var(--text-muted)",
              fontSize: "13px", fontWeight: 600, transition: "all 0.2s",
            }}
          >
            {tab === "simulator" ? "🤖 Simulador" : tab === "sessions" ? "💬 Sesiones" : "⚙️ Configuración"}
          </button>
        ))}
      </div>

      {/* ── SIMULADOR TAB ── */}
      {activeTab === "simulator" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "24px" }} className="whatsapp-grid">

          {/* Chat Window */}
          <section style={{
            borderRadius: "var(--radius-md)", overflow: "hidden",
            border: "1px solid rgba(255,255,255,0.08)",
            display: "flex", flexDirection: "column", height: "620px",
            boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
          }}>
            {/* WhatsApp top bar */}
            <div style={{
              background: "#202c33", padding: "12px 16px",
              display: "flex", alignItems: "center", gap: "12px",
              borderBottom: "1px solid rgba(255,255,255,0.05)",
            }}>
              <div style={{
                width: "40px", height: "40px", borderRadius: "50%",
                background: "linear-gradient(135deg, #25d366, #128c7e)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <MessageCircle size={20} color="#fff" />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontWeight: 700, fontSize: "14px", color: "#e9edef" }}>Krono Bot</p>
                <p style={{ margin: 0, fontSize: "12px", color: "#8696a0" }}>en línea</p>
              </div>
              <button
                onClick={resetChat}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#8696a0", display: "flex", alignItems: "center", gap: "4px", fontSize: "12px" }}
                title="Reiniciar conversación"
              >
                <RefreshCw size={14} /> Reiniciar
              </button>
            </div>

            {/* Messages area */}
            <div style={{
              flex: 1, overflowY: "auto", padding: "16px",
              background: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.01'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\") #0b141a",
            }}>
              {messages.map((msg, i) => renderBubble(msg, i))}
              {loading && (
                <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: "10px" }}>
                  <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "linear-gradient(135deg, #25d366, #128c7e)", marginRight: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <MessageCircle size={16} color="#fff" />
                  </div>
                  <div style={{ background: "#202c33", borderRadius: "0 16px 16px 16px", padding: "14px 18px", display: "flex", gap: "4px", alignItems: "center" }}>
                    {[0, 1, 2].map(i => (
                      <div key={i} style={{
                        width: "6px", height: "6px", borderRadius: "50%", background: "#8696a0",
                        animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
                      }} />
                    ))}
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Quick replies */}
            <div style={{ padding: "8px 16px", background: "#111b21", display: "flex", gap: "8px", overflowX: "auto", flexShrink: 0 }}>
              {QUICK_REPLIES.map(q => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  style={{
                    padding: "6px 14px", borderRadius: "20px", border: "1px solid rgba(37,211,102,0.3)",
                    background: "rgba(37,211,102,0.08)", color: "#25d366", fontSize: "12px",
                    fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.2s",
                  }}
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Input */}
            <div style={{ padding: "12px 16px", background: "#202c33", display: "flex", alignItems: "center", gap: "12px" }}>
              <input
                type="text"
                value={inputMsg}
                onChange={e => setInputMsg(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Escribe un mensaje..."
                disabled={loading}
                style={{
                  flex: 1, background: "#2a3942", border: "none", borderRadius: "8px",
                  padding: "10px 16px", color: "#e9edef", fontSize: "14px", outline: "none",
                }}
              />
              <button
                onClick={() => sendMessage()}
                disabled={!inputMsg.trim() || loading}
                style={{
                  width: "40px", height: "40px", borderRadius: "50%",
                  background: inputMsg.trim() && !loading ? "#00a884" : "#2a3942",
                  border: "none", cursor: inputMsg.trim() && !loading ? "pointer" : "default",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.2s",
                }}
              >
                <Send size={16} color="#fff" />
              </button>
            </div>
          </section>

          {/* Info sidebar */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <section className="section-card" style={{ background: "rgba(37,211,102,0.05)", border: "1px solid rgba(37,211,102,0.15)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
                <Info size={16} style={{ color: "#25d366" }} />
                <h4 style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: "#25d366" }}>Cómo funciona</h4>
              </div>
              <div style={{ fontSize: "13px", color: "var(--text-muted)", lineHeight: 1.6 }}>
                <p style={{ margin: "0 0 8px 0" }}>El bot guía al cliente a través de:</p>
                {[
                  "1️⃣ Elegir negocio",
                  "2️⃣ Elegir servicio",
                  "3️⃣ Introducir nombre",
                  "4️⃣ Elegir fecha",
                  "5️⃣ Elegir hora",
                  "6️⃣ Confirmar reserva",
                ].map((step, i) => (
                  <div key={i} style={{ padding: "6px 0", borderBottom: i < 5 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>{step}</div>
                ))}
              </div>
            </section>

            <section className="section-card" style={{ background: "rgba(255,255,255,0.01)", border: "1px solid var(--border)" }}>
              <h4 style={{ margin: "0 0 12px 0", fontSize: "14px", fontWeight: 700 }}>Comandos globales</h4>
              <div style={{ fontSize: "13px", display: "flex", flexDirection: "column", gap: "6px" }}>
                {[
                  { cmd: "hola / reservar", desc: "Iniciar reserva" },
                  { cmd: "cancelar / salir", desc: "Cancelar flujo" },
                  { cmd: "sí / confirmar", desc: "Confirmar cita" },
                  { cmd: "no", desc: "Rechazar y salir" },
                ].map(({ cmd, desc }) => (
                  <div key={cmd} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <code style={{ background: "rgba(99,102,241,0.15)", padding: "2px 8px", borderRadius: "4px", color: "var(--primary)", fontSize: "11px" }}>{cmd}</code>
                    <span style={{ color: "var(--text-muted)", fontSize: "12px" }}>{desc}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      )}

      {/* ── SESSIONS TAB ── */}
      {activeTab === "sessions" && (
        <section className="section-card" style={{ background: "rgba(255,255,255,0.01)", border: "1px solid var(--border)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700 }}>Sesiones Activas</h3>
            <button className="secondary-btn" onClick={fetchSessions} style={{ fontSize: "13px", padding: "8px 16px" }}>
              <RefreshCw size={14} /> Actualizar
            </button>
          </div>
          {sessionsLoading ? (
            <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
              <RefreshCw size={24} style={{ animation: "spin 1s linear infinite", margin: "0 auto 12px" }} />
              <p>Cargando sesiones...</p>
            </div>
          ) : sessions.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 24px", color: "var(--text-muted)" }}>
              <MessageCircle size={48} style={{ margin: "0 auto 16px", opacity: 0.3 }} />
              <p>No hay sesiones activas en este momento.</p>
            </div>
          ) : (
            <div className="table-scroll-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Teléfono</th>
                    <th>Paso actual</th>
                    <th>Negocio</th>
                    <th>Servicio</th>
                    <th>Fecha</th>
                    <th>Hora</th>
                    <th>Última actividad</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((s: any, i: number) => (
                    <tr key={i}>
                      <td><Phone size={12} style={{ marginRight: "4px" }} />{s.phoneNumber}</td>
                      <td><span className="badge badge--pending">{s.step}</span></td>
                      <td>{s.business?.name || "—"}</td>
                      <td>{s.service?.name || "—"}</td>
                      <td>{s.date || "—"}</td>
                      <td>{s.time || "—"}</td>
                      <td style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                        {s.lastActivity ? new Date(s.lastActivity).toLocaleTimeString("es-ES") : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* ── CONFIG TAB ── */}
      {activeTab === "config" && (
        <section className="section-card" style={{ background: "rgba(255,255,255,0.01)", border: "1px solid var(--border)", maxWidth: "640px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "24px" }}>
            <div style={{ width: "40px", height: "40px", borderRadius: "12px", background: "rgba(37,211,102,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Wifi size={20} style={{ color: "#25d366" }} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700 }}>Configuración del Webhook</h3>
              <p style={{ margin: 0, fontSize: "13px", color: "var(--text-muted)" }}>Conecta con la API de Meta WhatsApp Business Cloud</p>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div style={{ padding: "16px", borderRadius: "12px", background: "rgba(37,211,102,0.05)", border: "1px solid rgba(37,211,102,0.15)", fontSize: "13px", color: "var(--text-muted)" }}>
              <p style={{ margin: "0 0 8px 0", fontWeight: 600, color: "var(--text)" }}>🔗 URL del Webhook</p>
              <code style={{ background: "rgba(0,0,0,0.3)", padding: "6px 10px", borderRadius: "6px", display: "block", color: "#25d366", fontSize: "12px" }}>
                https://tu-dominio.com/whatsapp/webhook
              </code>
              <p style={{ margin: "12px 0 0 0" }}>Registra esta URL en el panel de Meta Business → WhatsApp → Webhooks.</p>
            </div>

            <div>
              <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>Token de Verificación</label>
              <input type="text" className="input" value={verifyToken} onChange={e => setVerifyToken(e.target.value)} placeholder="krono_verify_token_2024" />
              <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "6px" }}>Debe coincidir con la variable <code>WHATSAPP_TOKEN</code> en el backend.</p>
            </div>

            <div>
              <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>Phone Number ID (Meta)</label>
              <input type="text" className="input" value={phoneId} onChange={e => setPhoneId(e.target.value)} placeholder="123456789012345" />
            </div>

            <div>
              <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>API Key de Meta</label>
              <input type="password" className="input" value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="EAA..." />
            </div>

            <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
              <button className="primary-btn">
                <Wifi size={16} />
                Guardar configuración
              </button>
              <button className="secondary-btn">
                Probar conexión
              </button>
            </div>

            <div style={{ padding: "16px", borderRadius: "12px", background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.2)", fontSize: "13px" }}>
              <p style={{ margin: 0, color: "var(--text-muted)" }}>
                💡 <strong style={{ color: "var(--text)" }}>Sin cuenta Meta:</strong> El simulador funciona sin necesidad de configurar ningún webhook. Puedes hacer demos completos del bot desde la pestaña <em>Simulador</em>.
              </p>
            </div>
          </div>
        </section>
      )}

      <style jsx global>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-4px); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @media (max-width: 900px) {
          .whatsapp-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
