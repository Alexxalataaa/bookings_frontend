"use client";

import { Booking, Customer, Payment, getAppointments, getCustomers, getPayments } from "@/lib/api";
import Link from "next/link";
import { useEffect, useState } from "react";
import { 
  Calendar, 
  CreditCard, 
  Clock, 
  Users, 
  FileDown, 
  ArrowRight,
  TrendingUp,
  Activity
} from "lucide-react";
import { motion } from "framer-motion";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from "recharts";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

const COLORS = ['#6366f1', '#a855f7', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#14b8a6'];

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
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } }
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

export default function DashboardClient() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("auth_token");

        if (!token) {
          setError("No hay token de autenticación");
          return;
        }

        const [appointmentsData, customersData, paymentsData] = await Promise.all([
          getAppointments(),
          getCustomers(),
          getPayments()
        ]);

        setBookings(Array.isArray(appointmentsData) ? appointmentsData : []);
        setCustomers(Array.isArray(customersData) ? customersData : []);
        setPayments(Array.isArray(paymentsData) ? paymentsData : []);
        setError(null);
      } catch (err) {
        console.error("Dashboard fetch error:", err);
        setError(err instanceof Error ? err.message : "Error cargando datos");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
        <Activity size={32} style={{ margin: "0 auto 16px", opacity: 0.5 }} />
        <p>Cargando datos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "40px", textAlign: "center", color: "#f43f5e" }}>
        <p>Error: {error}</p>
        <p style={{ fontSize: "12px", marginTop: "8px", color: "var(--text-muted)" }}>
          Verifica que el backend esté corriendo en {API_URL}
        </p>
      </div>
    );
  }

  // --- CÁLCULOS ESTADÍSTICOS ---
  
  const todayDate = new Date();
  const currentMonth = todayDate.getMonth();
  const currentYear = todayDate.getFullYear();
  const todayStr = todayDate.toISOString().split("T")[0];

  const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const previousMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

  // KPIs
  const bookingsToday = bookings.filter((b) => b.date === todayStr);
  const pendingBookings = bookings.filter((b) => b.status === "pending");

  // Comparativa de ingresos mensuales
  const currentMonthPayments = payments.filter(p => {
    if (p.status !== "paid") return false;
    const d = new Date(p.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const previousMonthPayments = payments.filter(p => {
    if (p.status !== "paid") return false;
    const d = new Date(p.date);
    return d.getMonth() === previousMonth && d.getFullYear() === previousMonthYear;
  });

  const currentMonthIncome = currentMonthPayments.reduce((acc, p) => acc + Number(p.amount), 0);
  const previousMonthIncome = previousMonthPayments.reduce((acc, p) => acc + Number(p.amount), 0);
  
  const incomeGrowth = previousMonthIncome === 0 
    ? 100 
    : Math.round(((currentMonthIncome - previousMonthIncome) / previousMonthIncome) * 100);

  // Gráfica de Evolución de Ingresos (Últimos 6 meses)
  const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  const incomeData = [];
  for (let i = 5; i >= 0; i--) {
    let m = currentMonth - i;
    let y = currentYear;
    if (m < 0) {
      m += 12;
      y -= 1;
    }
    const mPayments = payments.filter(p => p.status === "paid" && new Date(p.date).getMonth() === m && new Date(p.date).getFullYear() === y);
    const total = mPayments.reduce((acc, p) => acc + Number(p.amount), 0);
    incomeData.push({ name: monthNames[m], ingresos: total });
  }

  // Gráfica de Reservas por Servicio
  const serviceCount: Record<string, number> = {};
  bookings.forEach(b => {
    const sName = b.serviceName || "Otro";
    serviceCount[sName] = (serviceCount[sName] || 0) + 1;
  });
  
  const bookingsByServiceData = Object.entries(serviceCount)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const recentBookings = [...bookings]
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
          <p>Supervisa el rendimiento y las estadísticas en tiempo real.</p>
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
          title="Ingresos este mes" 
          value={`${currentMonthIncome} €`} 
          subtitle={`${incomeGrowth >= 0 ? '+' : ''}${incomeGrowth}% vs mes pasado`} 
          variant={incomeGrowth >= 0 ? "positive" : "warning"}
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
          value={customers.length.toString()} 
          subtitle="Base de datos" 
          icon={Users}
        />
      </section>

      {/* SECCIÓN DE GRÁFICAS */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px', marginTop: '24px' }}>
         <motion.div variants={item} className="section-card">
           <h3 className="panel-title" style={{ marginBottom: "20px" }}>Evolución de Ingresos</h3>
           <div style={{ width: '100%', height: 300 }}>
             <ResponsiveContainer>
               <BarChart data={incomeData}>
                 <CartesianGrid strokeDasharray="3 3" opacity={0.2} vertical={false} />
                 <XAxis dataKey="name" axisLine={false} tickLine={false} />
                 <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `€${val}`} />
                 <RechartsTooltip cursor={{ fill: 'rgba(99, 102, 241, 0.1)' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                 <Bar dataKey="ingresos" fill="var(--primary)" radius={[4, 4, 0, 0]} />
               </BarChart>
             </ResponsiveContainer>
           </div>
         </motion.div>

         <motion.div variants={item} className="section-card">
           <h3 className="panel-title" style={{ marginBottom: "20px" }}>Reservas por Servicio</h3>
           <div style={{ width: '100%', height: 300 }}>
             <ResponsiveContainer>
               <PieChart>
                 <Pie
                   data={bookingsByServiceData}
                   cx="50%"
                   cy="50%"
                   innerRadius={60}
                   outerRadius={100}
                   paddingAngle={5}
                   dataKey="value"
                 >
                   {bookingsByServiceData.map((entry, index) => (
                     <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                   ))}
                 </Pie>
                 <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                 <Legend />
               </PieChart>
             </ResponsiveContainer>
           </div>
         </motion.div>
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
              <span style={{ fontSize: "24px", fontWeight: 700 }}>{currentMonthIncome} €</span>
              <span style={{ color: incomeGrowth >= 0 ? "var(--success)" : "#f43f5e", fontSize: "12px", fontWeight: 600 }}>
                {incomeGrowth >= 0 ? '+' : ''}{incomeGrowth}% vs mes anterior
              </span>
            </div>
            <p className="info-box__text">Mes actual: has registrado {currentMonthPayments.length} pagos completados.</p>
          </motion.div>
        </div>
      </section>
    </motion.div>
  );
}
