"use client";

import { useState, useMemo } from "react";
import { Payment, CreatePaymentDto, createPayment, updatePayment, deletePayment } from "@/lib/api";
import { 
  Wallet, 
  TrendingUp, 
  AlertCircle, 
  History, 
  Plus, 
  Check, 
  X, 
  RefreshCw,
  ArrowRight,
  CreditCard,
  Banknote,
  Smartphone,
  Send
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

function KpiCard({
  title,
  value,
  subtitle,
  variant,
  icon: Icon,
}: {
  title: string;
  value: string;
  subtitle: string;
  variant?: "positive" | "warning";
  icon: any;
}) {
  return (
    <motion.div variants={item} className="kpi-card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <p className="kpi-card__label">{title}</p>
          <h3 className="kpi-card__value">{value}</h3>
        </div>
        <div className={`kpi-icon-wrapper ${variant || ""}`}>
          <Icon size={22} />
        </div>
      </div>
      <p
        className={`kpi-card__meta ${
          variant === "positive"
            ? "kpi-card__meta--positive"
            : variant === "warning"
              ? "kpi-card__meta--warning"
              : ""
        }`}
      >
        {subtitle}
      </p>
    </motion.div>
  );
}

function Badge({ status }: { status: "pending" | "paid" }) {
  return (
    <span className={`badge badge--${status === "pending" ? "pending" : "confirmed"}`}>
      {status === "pending" ? "Por cobrar" : "Pagado"}
    </span>
  );
}

const MethodIcon = ({ method }: { method: string }) => {
  switch (method.toLowerCase()) {
    case "tarjeta": return <CreditCard size={14} />;
    case "efectivo": return <Banknote size={14} />;
    case "bizum": return <Smartphone size={14} />;
    case "transferencia": return <Send size={14} />;
    default: return <Wallet size={14} />;
  }
};

export default function PaymentsClient({
  initialPayments,
}: {
  initialPayments: Payment[];
}) {
  const [payments, setPayments] = useState<Payment[]>(initialPayments);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState<CreatePaymentDto>({
    clientName: "",
    businessName: "",
    amount: 0,
    method: "Tarjeta",
    date: new Date().toISOString().split("T")[0],
    status: "paid",
  });
  const [loading, setLoading] = useState(false);

  const kpis = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    const todayPayments = payments.filter((p) => p.date === today && p.status === "paid");
    const totalToday = todayPayments.reduce((acc, p) => acc + Number(p.amount), 0);
    const pending = payments.filter((p) => p.status === "pending");
    const totalPending = pending.reduce((acc, p) => acc + Number(p.amount), 0);

    return {
      totalToday,
      todayCount: todayPayments.length,
      totalPending,
      pendingCount: pending.length,
    };
  }, [payments]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const created = await createPayment(formData);
      setPayments([created, ...payments]);
      setIsFormOpen(false);
      setFormData({
        clientName: "",
        businessName: "",
        amount: 0,
        method: "Tarjeta",
        date: new Date().toISOString().split("T")[0],
        status: "paid",
      });
    } catch (error) {
      console.error("Error saving payment", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusToggle(payment: Payment) {
    const newStatus = payment.status === "pending" ? "paid" : "pending";
    try {
      const updated = await updatePayment(payment.id, { status: newStatus });
      setPayments(payments.map((p) => (p.id === payment.id ? updated : p)));
    } catch (error) {
      console.error("Error updating payment", error);
    }
  }

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="page-stack"
    >
      <motion.section variants={item} className="page-hero">
        <div>
          <h2>Control de Pagos</h2>
          <p>Supervisión financiera y registro de transacciones.</p>
        </div>

        <button 
          className="primary-btn" 
          type="button" 
          onClick={() => setIsFormOpen(true)}
        >
          <Plus size={18} />
          <span>Registrar cobro</span>
        </button>
      </motion.section>

      <section className="kpi-grid">
        <KpiCard
          title="Cobrado hoy"
          value={`${kpis.totalToday} €`}
          subtitle={`${kpis.todayCount} operaciones realizadas`}
          variant="positive"
          icon={TrendingUp}
        />
        <KpiCard
          title="Pendiente"
          value={`${kpis.totalPending} €`}
          subtitle={`${kpis.pendingCount} cobros por procesar`}
          variant="warning"
          icon={AlertCircle}
        />
        <KpiCard 
          title="Histórico" 
          value={`${payments.reduce((acc, p) => acc + (p.status === "paid" ? Number(p.amount) : 0), 0)} €`} 
          subtitle="Total acumulado" 
          icon={History}
        />
        <KpiCard 
          title="Operaciones" 
          value={`${payments.length}`} 
          subtitle="Total transacciones" 
          icon={RefreshCw}
        />
      </section>

      <AnimatePresence>
        {isFormOpen && (
          <motion.section 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="section-card"
          >
            <div className="panel-title-row">
              <h3 className="panel-title">Nuevo Cobro</h3>
              <button type="button" className="secondary-btn" onClick={() => setIsFormOpen(false)}>
                <X size={16} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="page-stack" style={{ marginTop: 24, gap: 24 }}>
              <div className="form-grid">
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <label style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-muted)" }}>Cliente</label>
                  <input
                    className="input"
                    placeholder="Nombre del cliente"
                    value={formData.clientName}
                    onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                    required
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <label style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-muted)" }}>Comercio</label>
                  <input
                    className="input"
                    placeholder="Nombre del comercio"
                    value={formData.businessName}
                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                    required
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <label style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-muted)" }}>Importe (€)</label>
                  <input
                    className="input"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                    required
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <label style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-muted)" }}>Método</label>
                  <select
                    className="select"
                    value={formData.method}
                    onChange={(e) => setFormData({ ...formData, method: e.target.value })}
                  >
                    <option value="Tarjeta">💳 Tarjeta</option>
                    <option value="Efectivo">💵 Efectivo</option>
                    <option value="Bizum">📱 Bizum</option>
                    <option value="Transferencia">🏦 Transferencia</option>
                  </select>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <label style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-muted)" }}>Fecha</label>
                  <input
                    className="input"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <label style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-muted)" }}>Estado</label>
                  <select
                    className="select"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as "pending" | "paid" })}
                  >
                    <option value="paid">Pagado</option>
                    <option value="pending">Pendiente</option>
                  </select>
                </div>
              </div>
              
              <div style={{ display: "flex", gap: 12 }}>
                <button className="primary-btn" type="submit" disabled={loading}>
                  <Check size={18} />
                  <span>{loading ? "Registrando..." : "Confirmar Cobro"}</span>
                </button>
                <button className="secondary-btn" type="button" onClick={() => setIsFormOpen(false)}>
                  Cancelar
                </button>
              </div>
            </form>
          </motion.section>
        )}
      </AnimatePresence>

      <motion.section variants={item} className="section-card">
        <div className="panel-title-row" style={{ marginBottom: 32 }}>
          <h3 className="panel-title">Listado de Cobros</h3>
          <div className="badge" style={{ background: "rgba(255,255,255,0.05)", textTransform: "none" }}>
            {payments.length} operaciones registradas
          </div>
        </div>

        <div className="table-scroll-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Cliente / Comercio</th>
                <th>Importe</th>
                <th>Método</th>
                <th>Fecha</th>
                <th>Estado</th>
                <th style={{ textAlign: "right" }}>Acción</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <motion.tr layout key={payment.id}>
                  <td style={{ fontWeight: 700, color: "var(--text-muted)" }}>#{payment.id}</td>
                  <td>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span style={{ fontWeight: 600 }}>{payment.clientName}</span>
                      <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>{payment.businessName}</span>
                    </div>
                  </td>
                  <td style={{ fontWeight: 700, fontSize: "16px" }}>{payment.amount} €</td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--text-muted)" }}>
                      <MethodIcon method={payment.method} />
                      <span style={{ fontSize: "14px" }}>{payment.method}</span>
                    </div>
                  </td>
                  <td style={{ fontSize: "14px", color: "var(--text-muted)" }}>{payment.date}</td>
                  <td>
                    <Badge status={payment.status} />
                  </td>
                  <td style={{ textAlign: "right" }}>
                     <button 
                      onClick={() => handleStatusToggle(payment)} 
                      className="secondary-btn" 
                      style={{ 
                        padding: "8px 14px", 
                        fontSize: "12px",
                        borderColor: payment.status === "pending" ? "var(--success)" : "var(--border)",
                        color: payment.status === "pending" ? "var(--success)" : "var(--text-muted)"
                      }}
                    >
                      <ArrowRight size={14} style={{ marginRight: "6px" }} />
                      Marcar como {payment.status === "pending" ? "Pagado" : "Pendiente"}
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.section>
    </motion.div>
  );
}

