"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { Payment, CreatePaymentDto, createPayment, updatePayment, deletePayment, getPayments, getCustomers, Customer } from "@/lib/api";
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
  Send,
  Download,
  Search
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

const formatCurrency = (val: number) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(val);

export default function PaymentsClient() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    setUserRole(localStorage.getItem("user_role"));
    Promise.all([getPayments(), getCustomers()])
      .then(([paymentsData, customersData]) => {
        setPayments(paymentsData);
        setCustomers(customersData);
      })
      .catch((err) => console.error("Error fetching data:", err))
      .finally(() => setInitialLoading(false));
  }, []);

  const filteredPayments = useMemo(() => {
    if (!search.trim()) return payments;
    const lower = search.toLowerCase();
    return payments.filter(p =>
      p.clientName.toLowerCase().includes(lower) ||
      p.businessName.toLowerCase().includes(lower) ||
      p.method.toLowerCase().includes(lower)
    );
  }, [payments, search]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const formRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (isFormOpen && formRef.current) {
      const timer = setTimeout(() => {
        formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isFormOpen]);
  const [formData, setFormData] = useState<{
    clientName: string;
    businessName: string;
    amount: number | "";
    method: string;
    date: string;
    status: "pending" | "paid";
  }>({
    clientName: "",
    businessName: "",
    amount: "",
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
      const created = await createPayment({
        ...formData,
        businessName: userRole === "business" ? (localStorage.getItem("user_name") || "Mi Comercio") : formData.businessName,
        amount: formData.amount === "" ? 0 : Number(formData.amount),
      });
      setPayments([created, ...payments]);
      setIsFormOpen(false);
      setFormData({
        clientName: "",
        businessName: "",
        amount: "",
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

  const handleExport = () => {
    if (payments.length === 0) return;

    const headers = ["ID", "Cliente", "Comercio", "Importe", "Método", "Fecha", "Estado"];
    const rows = payments.map(p => [
      p.id,
      p.clientName,
      p.businessName,
      p.amount,
      p.method,
      p.date,
      p.status === "paid" ? "Pagado" : "Pendiente"
    ]);

    const csvContent = [
      headers.join(";"),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(";"))
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `cobros_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (initialLoading) {
    return (
      <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
        <p>Cargando pagos...</p>
      </div>
    );
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

        <div style={{ display: "flex", gap: "12px" }}>
          <button 
            className="secondary-btn" 
            type="button" 
            onClick={handleExport}
          >
            <Download size={18} />
            <span>Exportar</span>
          </button>
          <button 
            className="primary-btn" 
            type="button" 
            onClick={() => {
              getCustomers().then(setCustomers).catch(console.error);
              setIsFormOpen(true);
            }}
          >
            <Plus size={18} />
            <span>Registrar cobro</span>
          </button>
        </div>
      </motion.section>

      <section className="kpi-grid">
        <KpiCard
          title="Cobrado hoy"
          value={formatCurrency(kpis.totalToday)}
          subtitle={`${kpis.todayCount} operaciones realizadas`}
          variant="positive"
          icon={TrendingUp}
        />
        <KpiCard
          title="Pendiente"
          value={formatCurrency(kpis.totalPending)}
          subtitle={`${kpis.pendingCount} cobros por procesar`}
          variant="warning"
          icon={AlertCircle}
        />
        <KpiCard 
          title="Histórico" 
          value={formatCurrency(payments.reduce((acc, p) => acc + (p.status === "paid" ? Number(p.amount) : 0), 0))} 
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
            ref={formRef}
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
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", position: "relative" }}>
                  <label style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-muted)" }}>Cliente</label>
                  <input
                    className="input"
                    placeholder="Nombre del cliente"
                    value={formData.clientName}
                    onChange={(e) => {
                      setFormData({ ...formData, clientName: e.target.value });
                      setShowCustomerDropdown(true);
                    }}
                    onFocus={() => setShowCustomerDropdown(true)}
                    onBlur={() => setTimeout(() => setShowCustomerDropdown(false), 200)}
                    required
                  />
                  {showCustomerDropdown && formData.clientName && (
                    <ul style={{
                      position: "absolute", top: "100%", left: 0, right: 0,
                      background: "rgba(15,17,22,0.95)", backdropFilter: "blur(10px)",
                      border: "1px solid var(--border)", borderRadius: "8px",
                      marginTop: "4px", zIndex: 50, listStyle: "none", padding: "4px",
                      maxHeight: "200px", overflowY: "auto"
                    }}>
                      {customers.filter(c => c.name.toLowerCase().includes(formData.clientName.toLowerCase())).map(c => (
                        <li 
                          key={c.id} 
                          style={{ padding: "8px 12px", cursor: "pointer", borderRadius: "4px", fontSize: "14px" }}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setFormData({ ...formData, clientName: c.name });
                            setShowCustomerDropdown(false);
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = "var(--primary-gradient)"}
                          onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                        >
                          {c.name} {c.email ? `(${c.email})` : ''}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                {userRole !== "business" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <label style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-muted)" }}>Comercio</label>
                    <input
                      className="input"
                      placeholder="Nombre del comercio"
                      value={formData.businessName}
                      onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                      required={userRole !== "business"}
                    />
                  </div>
                )}
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <label style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-muted)" }}>Importe (€)</label>
                  <input
                    className="input"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData({ ...formData, amount: val === "" ? "" : Number(val) });
                    }}
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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32, flexWrap: "wrap", gap: "16px" }}>
          <div>
            <h3 className="panel-title" style={{ margin: 0 }}>Listado de Cobros</h3>
            <div className="badge" style={{ background: "rgba(255,255,255,0.05)", textTransform: "none", marginTop: "4px" }}>
              {filteredPayments.length} operaciones encontradas
            </div>
          </div>
          <div style={{ position: "relative", width: "300px" }}>
            <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            <input
              type="text"
              className="input"
              placeholder="Buscar por cliente, comercio o método..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: "36px", fontSize: "13px", height: "36px" }}
            />
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
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "20px" }}>No se encontraron cobros.</td>
                </tr>
              ) : (
                filteredPayments.map((payment) => (
                <motion.tr layout key={payment.id}>
                  <td style={{ fontWeight: 700, color: "var(--text-muted)" }}>#{payment.id}</td>
                  <td>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span style={{ fontWeight: 600 }}>{payment.clientName}</span>
                      <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>{payment.businessName}</span>
                    </div>
                  </td>
                  <td style={{ fontWeight: 700, fontSize: "16px" }}>{formatCurrency(Number(payment.amount))}</td>
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.section>
    </motion.div>
  );
}

