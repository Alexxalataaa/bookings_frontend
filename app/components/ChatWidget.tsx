"use client";

import { useEffect, useState, useRef } from "react";
import { MessageCircle, Send, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { whatsappSimulate } from "@/lib/api";

interface ChatMessage {
  from: "user" | "bot";
  text: string;
  time: string;
}

function now() {
  return new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
}

export default function ChatWidget() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatClientId, setChatClientId] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Generate a unique client ID for this user session if not exists
    let cid = sessionStorage.getItem("wa_client_id");
    if (!cid) {
      cid = "client_" + Math.random().toString(36).substring(2, 9);
      sessionStorage.setItem("wa_client_id", cid);
    }
    setChatClientId(cid);
    
    // Initial bot message
    setChatMessages([
      {
        from: "bot",
        text: "👋 ¡Hola! Soy el asistente virtual. Escribe *hola* o *reservar* para ayudarte a agendar una cita rápidamente.",
        time: now(),
      }
    ]);
  }, []);

  useEffect(() => {
    if (isChatOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, isChatOpen]);

  const handleSend = () => {
    if (chatInput.trim() && !chatLoading) {
      const text = chatInput.trim();
      setChatInput("");
      setChatMessages(prev => [...prev, { from: "user", text, time: now() }]);
      setChatLoading(true);
      whatsappSimulate(chatClientId, text).then(({ reply }) => {
        setChatMessages(prev => [...prev, { from: "bot", text: reply, time: now() }]);
      }).catch(() => {
        setChatMessages(prev => [...prev, { from: "bot", text: "⚠️ Error de conexión.", time: now() }]);
      }).finally(() => setChatLoading(false));
    }
  };

  return (
    <>
      <AnimatePresence>
        {isChatOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            style={{
              position: "fixed",
              bottom: "90px",
              right: "24px",
              width: "360px",
              height: "500px",
              background: "#0b141a",
              borderRadius: "16px",
              boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
              border: "1px solid rgba(255,255,255,0.1)",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              zIndex: 9999,
            }}
          >
            {/* Header */}
            <div style={{ background: "#202c33", padding: "12px 16px", display: "flex", alignItems: "center", gap: "12px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "linear-gradient(135deg, #25d366, #128c7e)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <MessageCircle size={18} color="#fff" />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontWeight: 700, fontSize: "14px", color: "#e9edef" }}>Asistente Krono</p>
                <p style={{ margin: 0, fontSize: "11px", color: "#8696a0" }}>en línea</p>
              </div>
              <button onClick={() => setIsChatOpen(false)} style={{ background: "none", border: "none", color: "#8696a0", cursor: "pointer", display: "flex" }}>
                <X size={20} />
              </button>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: "auto", padding: "16px", background: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.01'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\") #0b141a" }}>
              {chatMessages.map((msg, idx) => {
                const isBot = msg.from === "bot";
                const formattedText = msg.text.split("\n").map((line, i) => (
                  <span key={i} style={{ display: "block", marginBottom: line ? "0" : "8px" }}>
                    {line.split(/\*(.*?)\*/g).map((part, j) => j % 2 === 1 ? <strong key={j}>{part}</strong> : <span key={j}>{part}</span>)}
                  </span>
                ));

                return (
                  <motion.div key={idx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ display: "flex", justifyContent: isBot ? "flex-start" : "flex-end", marginBottom: "10px" }}>
                    {isBot && (
                      <div style={{ width: "24px", height: "24px", borderRadius: "50%", flexShrink: 0, background: "linear-gradient(135deg, #25d366, #128c7e)", marginRight: "8px", display: "flex", alignItems: "center", justifyContent: "center", alignSelf: "flex-end" }}>
                        <MessageCircle size={12} color="#fff" />
                      </div>
                    )}
                    <div style={{ maxWidth: "80%", background: isBot ? "#202c33" : "#005c4b", borderRadius: isBot ? "12px 12px 12px 2px" : "12px 12px 2px 12px", padding: "8px 12px", fontSize: "13px", lineHeight: 1.4, color: "#e9edef", boxShadow: "0 1px 2px rgba(0,0,0,0.3)" }}>
                      {formattedText}
                      <div style={{ fontSize: "10px", color: "rgba(233,237,239,0.5)", marginTop: "4px", textAlign: "right" }}>{msg.time}</div>
                    </div>
                  </motion.div>
                );
              })}
              {chatLoading && (
                <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: "10px" }}>
                  <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "linear-gradient(135deg, #25d366, #128c7e)", marginRight: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <MessageCircle size={12} color="#fff" />
                  </div>
                  <div style={{ background: "#202c33", borderRadius: "12px 12px 12px 2px", padding: "10px 14px", display: "flex", gap: "4px", alignItems: "center" }}>
                    {[0, 1, 2].map(i => <div key={i} style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#8696a0", animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }} />)}
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div style={{ padding: "10px 12px", background: "#202c33", display: "flex", alignItems: "center", gap: "8px" }}>
              <input
                type="text"
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Escribe un mensaje..."
                disabled={chatLoading}
                style={{ flex: 1, background: "#2a3942", border: "none", borderRadius: "20px", padding: "10px 16px", color: "#e9edef", fontSize: "13px", outline: "none" }}
              />
              <button
                onClick={handleSend}
                disabled={!chatInput.trim() || chatLoading}
                style={{ width: "36px", height: "36px", borderRadius: "50%", background: chatInput.trim() && !chatLoading ? "#00a884" : "#2a3942", border: "none", cursor: chatInput.trim() && !chatLoading ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }}
              >
                <Send size={16} color="#fff" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button 
        onClick={() => setIsChatOpen(!isChatOpen)}
        style={{
          position: "fixed",
          bottom: "24px",
          right: "24px",
          width: "60px",
          height: "60px",
          borderRadius: "50%",
          background: "#25d366",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 14px rgba(0,0,0,0.3)",
          zIndex: 10000,
          transition: "transform 0.2s",
          transform: isChatOpen ? "scale(0.9)" : "scale(1)",
        }}
      >
        {isChatOpen ? <X size={28} color="#fff" /> : <MessageCircle size={28} color="#fff" />}
      </button>
    </>
  );
}
