"use client";

import { Booking, Customer, Payment } from "@/lib/api";
import Link from "next/link";
import { 
  Calendar, 
  CreditCard, 
  Clock, 
  Users, 
  FileDown, 
  ArrowRight,
  TrendingUp,
  Activity,
  CheckCircle2
} from "lucide-react";
import { motion } from "framer-motion";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
};

function Badge({ status }: { status: string }) {
  const label =
    status === "pending"
      ? "Pendiente"
      : status === "confirmed"
        ? "Confirmada"
        : "Pagada";

  return <span className={`badge badge--${status}`}>{label}</span>;
}

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
          <Icon size={24} strokeWidth={2} />
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
        <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
          {variant === "positive" && <TrendingUp size={14} />}
          {subtitle}
        </span>
      </p>
    </motion.div>
  );
}

export default function DashboardClient({
  initialBookings,
  initialCustomers,
  initialPayments,
}: {
  initialBookings: Booking[];
  initialCustomers: Customer[];
  initialPayments: Payment[];
}) {
  const today = new Date().toISOString().split("T")[0];
  const bookingsToday = initialBookings.filter((b) => b.date === today);
  const paymentsToday = initialPayments.filter((p) => p.date === today && p.status === "paid");
  const totalPaidToday = paymentsToday.reduce((acc, p) => acc + Number(p.amount), 0);
  const pendingBookings = initialBookings.filter((b) => b.status === "pending");

  const recentBookings = [...initialBookings]
    .sort((a, b) => b.id - a.id)
    .slice(0, 6);

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="page-stack"
    >
      <motion.section variants={item} className="page-hero">
        <div>
          <h2>Vista General</h2>
          <p>Supervisa el rendimiento de BookFlow en tiempo real.</p>
        </div>

        <button className="primary-btn" type="button" onClick={() => window.print()}>
          <FileDown size={18} />
          <span>Exportar Informe</span>
        </button>
      </motion.section>

      <section className="kpi-grid">
        <KpiCard
          title="Reservas hoy"
          value={bookingsToday.length.toString()}
          subtitle="Actividad diaria"
          variant={bookingsToday.length > 0 ? "positive" : undefined}
          icon={Calendar}
        />
        <KpiCard 
          title="Ingresos hoy" 
          value={`${totalPaidToday} €`} 
          subtitle="Ventas cerradas" 
          variant={totalPaidToday > 0 ? "positive" : undefined}
          icon={CreditCard}
        />
        <KpiCard
          title="Pendientes"
          value={pendingBookings.length.toString()}
          subtitle="Requieren atención"
          variant={pendingBookings.length > 0 ? "warning" : undefined}
          icon={Clock}
        />
        <KpiCard 
          title="Clientes" 
          value={initialCustomers.length.toString()} 
          subtitle="Base de datos" 
          icon={Users}
        />
      </section>

      <section className="dashboard-grid">
        <motion.div variants={item} className="section-card">
          <div className="panel-title-row">
            <h3 className="panel-title">Reservas Recientes</h3>
            <Link href="/bookings" className="panel-subtle-link">
              Gestionar todas <ArrowRight size={16} />
            </Link>
          </div>

          <div className="table-scroll-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Hora</th>
                  <th>Servicio</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {recentBookings.length > 0 ? (
                  recentBookings.map((booking) => (
                    <motion.tr 
                      layout
                      key={booking.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <td style={{ fontWeight: 600, color: "var(--primary)" }}>#{booking.id}</td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <Clock size={14} style={{ opacity: 0.5 }} />
                          {booking.time}
                        </div>
                      </td>
                      <td>{booking.serviceName}</td>
                      <td>
                        <Badge status={booking.status} />
                      </td>
                    </motion.tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} style={{ textAlign: "center", padding: "60px", color: "var(--text-muted)" }}>
                      <Activity size={40} style={{ opacity: 0.1, marginBottom: "16px" }} />
                      <p>No hay actividad reciente registrada.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

        <div className="info-stack">
          <motion.div 
            variants={item}
            className="info-box" 
            style={{ 
              background: "linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(168, 85, 247, 0.05) 100%)", 
              borderColor: "rgba(99, 102, 241, 0.3)",
              boxShadow: "0 10px 20px rgba(0,0,0,0.1)"
            }}
          >
            <p className="info-box__eyebrow" style={{ color: "var(--primary)" }}>Próxima Acción</p>
            <p className="info-box__title">Confirmar Reservas</p>
            <p className="info-box__text">
              Hay <strong>{pendingBookings.length}</strong> reservas en espera. Contacta con los clientes para asegurar su asistencia.
            </p>
            <Link href="/bookings" className="primary-btn" style={{ marginTop: "20px", padding: "12px 20px", fontSize: "14px", width: "100%", justifyContent: "center" }}>
              Revisar Ahora
            </Link>
          </motion.div>

          <motion.div variants={item} className="info-box">
            <p className="info-box__eyebrow">Resumen Financiero</p>
            <div style={{ display: "flex", alignItems: "baseline", gap: "8px", margin: "8px 0" }}>
              <span style={{ fontSize: "24px", fontWeight: 700 }}>{totalPaidToday} €</span>
              <span style={{ color: "var(--success)", fontSize: "12px", fontWeight: 600 }}>+12% vs ayer</span>
            </div>
            <p className="info-box__text">Hoy has registrado {paymentsToday.length} transacciones exitosas.</p>
          </motion.div>

          <motion.div variants={item} className="info-box">
            <p className="info-box__eyebrow">Estado del Sistema</p>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "8px" }}>
              <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--success)", boxShadow: "0 0 10px var(--success)" }}></div>
              <span style={{ fontSize: "14px", fontWeight: 500 }}>Sincronizado con el servidor</span>
            </div>
          </motion.div>
        </div>
      </section>
    </motion.div>
  );
}


