"use client";

import { useEffect, useState } from "react";
import { 
  Calendar as CalendarIcon, 
  CreditCard, 
  Clock, 
  Users, 
  Search, 
  Filter, 
  Star, 
  MapPin, 
  Activity, 
  TrendingUp, 
  Scissors, 
  Sparkles,
  ShieldCheck,
  Ban,
  Trash2,
  Plus,
  RefreshCw,
  LogOut,
  UserCheck,
  CheckCircle,
  FileCode2,
  ChevronRight,
  TrendingDown
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, 
  AreaChart, Area, PieChart, Pie, Cell, Legend 
} from "recharts";

// Default Mock Databases stored in localStorage for persistent interactive states
const DEFAULT_BUSINESSES = [
  { id: 1, name: "Salón Alicante Futura", category: "Estética", city: "Alicante", street: "Av. Constitución 12", zipCode: "03002", phone: "965123456", email: "salon@alicantefutura.es", image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=500&auto=format&fit=crop&q=60", rating: 4.9, reviews: 124, hours: "09:00 - 20:00", isSuspended: false, createdAt: "2026-01-10" },
  { id: 2, name: "Barbería del Puerto", category: "Estética", city: "Alicante", street: "Muelle de Levante 4", zipCode: "03001", phone: "965654321", email: "info@barberiapuerto.es", image: "https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=500&auto=format&fit=crop&q=60", rating: 4.8, reviews: 86, hours: "10:00 - 21:00", isSuspended: false, createdAt: "2026-02-15" },
  { id: 3, name: "Fisioterapia San Blas", category: "Salud", city: "Alicante", street: "Calle Pintor Gisbert 28", zipCode: "03005", phone: "965987654", email: "contacto@fisiosanblas.es", image: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=500&auto=format&fit=crop&q=60", rating: 4.7, reviews: 54, hours: "08:00 - 18:00", isSuspended: false, createdAt: "2026-03-01" },
  { id: 4, name: "Masajes & Relax Zen", category: "Bienestar", city: "Elche", street: "Carrer Ample 15", zipCode: "03202", phone: "966112233", email: "relax@zenmasajes.es", image: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=500&auto=format&fit=crop&q=60", rating: 5.0, reviews: 42, hours: "10:00 - 20:00", isSuspended: false, createdAt: "2026-04-12" },
  { id: 5, name: "Estética Avanzada Glow", category: "Estética", city: "Elche", street: "Av. del País Valencià 45", zipCode: "03201", phone: "966445566", email: "glow@esteticaglow.es", image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=500&auto=format&fit=crop&q=60", rating: 4.6, reviews: 63, hours: "09:00 - 19:00", isSuspended: false, createdAt: "2026-05-02" }
];

const DEFAULT_SERVICES = [
  { id: 1, businessId: 1, name: "Corte de Pelo & Estilo", duration: 30, price: 18 },
  { id: 2, businessId: 1, name: "Tinte & Color Orgánico", duration: 90, price: 45 },
  { id: 3, businessId: 1, name: "Manicura semipermanente", duration: 45, price: 20 },
  { id: 4, businessId: 2, name: "Afeitado Clásico con Toalla Caliente", duration: 40, price: 22 },
  { id: 5, businessId: 3, name: "Sesión Fisioterapia Deportiva", duration: 50, price: 45 }
];

const DEFAULT_BOOKINGS = [
  { id: 101, date: "2026-05-27", time: "10:30", customerName: "David Silva", customerId: 1, businessId: 1, serviceName: "Corte de Pelo & Estilo", price: 18, status: "completed", rating: 5, comment: "Corte perfecto, atención de primera." },
  { id: 102, date: "2026-05-27", time: "12:00", customerName: "Lucía Fernández", customerId: 2, businessId: 1, serviceName: "Manicura semipermanente", price: 20, status: "confirmed" },
  { id: 103, date: "2026-05-28", time: "16:30", customerName: "Carlos Gómez", customerId: 3, businessId: 1, serviceName: "Tinte & Color Orgánico", price: 45, status: "pending" },
  { id: 104, date: "2026-05-29", time: "11:00", customerName: "Paula Ruiz", customerId: 4, businessId: 2, serviceName: "Afeitado Clásico", price: 22, status: "pending" }
];

const DEFAULT_PAYMENTS = [
  { id: 201, clientName: "David Silva", businessName: "Salón Alicante Futura", amount: 18.00, method: "Tarjeta", date: "2026-05-27", status: "paid" },
  { id: 202, clientName: "Juan Pérez", businessName: "Barbería del Puerto", amount: 22.00, method: "Efectivo", date: "2026-05-26", status: "paid" },
  { id: 203, clientName: "Laura Sanz", businessName: "Fisioterapia San Blas", amount: 45.00, method: "Bizum", date: "2026-05-25", status: "paid" }
];

const DEFAULT_LOGS = [
  { id: 1, timestamp: "12:44:11", user: "Cliente Premium", action: "Creación de Reserva", details: "Reservó Corte de Pelo en Salón Alicante Futura" },
  { id: 2, timestamp: "12:32:04", user: "Administrador Global", action: "Inicio de Sesión", details: "Acceso autorizado a la consola de Superadmin" },
  { id: 3, timestamp: "11:15:30", user: "Salón Alicante Futura", action: "Actualización de Horarios", details: "Actualizó horario a 09:00 - 20:00" },
  { id: 4, timestamp: "10:02:15", user: "Barbería del Puerto", action: "Creación de Servicio", details: "Añadió Afeitado Clásico con Toalla Caliente" }
];

export default function DashboardClient() {
  const [userRole, setUserRole] = useState<"client" | "business" | "superadmin">("business");
  const [userName, setUserName] = useState("Usuario Premium");
  const [loading, setLoading] = useState(true);

  // Database states loaded from localStorage or initialized with defaults
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);

  // Search and Filters for Client view
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [selectedCity, setSelectedCity] = useState("Todos");
  
  // Booking Form modal states
  const [activeBookingBusiness, setActiveBookingBusiness] = useState<any | null>(null);
  const [selectedService, setSelectedService] = useState<any | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [showBookingSuccess, setShowBookingSuccess] = useState(false);

  // Superadmin States
  const [newAdminUser, setNewAdminUser] = useState("");
  const [newAdminPass, setNewAdminPass] = useState("");
  const [showNewAdminSuccess, setShowNewAdminSuccess] = useState(false);

  useEffect(() => {
    // 1. Get Authentication State
    const role = localStorage.getItem("user_role") || "business";
    const name = localStorage.getItem("user_name") || "Usuario de BookFlow";
    setUserRole(role as any);
    setUserName(name);

    // 2. Initialize localStorage databases
    if (!localStorage.getItem("db_businesses")) localStorage.setItem("db_businesses", JSON.stringify(DEFAULT_BUSINESSES));
    if (!localStorage.getItem("db_services")) localStorage.setItem("db_services", JSON.stringify(DEFAULT_SERVICES));
    if (!localStorage.getItem("db_bookings")) localStorage.setItem("db_bookings", JSON.stringify(DEFAULT_BOOKINGS));
    if (!localStorage.getItem("db_payments")) localStorage.setItem("db_payments", JSON.stringify(DEFAULT_PAYMENTS));
    if (!localStorage.getItem("db_logs")) localStorage.setItem("db_logs", JSON.stringify(DEFAULT_LOGS));

    setBusinesses(JSON.parse(localStorage.getItem("db_businesses")!));
    setServices(JSON.parse(localStorage.getItem("db_services")!));
    setBookings(JSON.parse(localStorage.getItem("db_bookings")!));
    setPayments(JSON.parse(localStorage.getItem("db_payments")!));
    setActivityLogs(JSON.parse(localStorage.getItem("db_logs")!));

    setLoading(false);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user_role");
    localStorage.removeItem("user_name");
    window.location.href = "/login";
  };

  // Re-save database helper
  const updateLocalStorage = (key: string, data: any) => {
    localStorage.setItem(key, JSON.stringify(data));
  };

  // Business Action: Confirm Cita
  const handleConfirmBooking = (bookingId: number) => {
    const updated = bookings.map(b => b.id === bookingId ? { ...b, status: "confirmed" } : b);
    setBookings(updated);
    updateLocalStorage("db_bookings", updated);

    // Log Activity
    const newLog = {
      id: Date.now(),
      timestamp: new Date().toTimeString().split(" ")[0],
      user: userName,
      action: "Confirmar Reserva",
      details: `Confirmó la reserva #${bookingId}`
    };
    const updatedLogs = [newLog, ...activityLogs];
    setActivityLogs(updatedLogs);
    updateLocalStorage("db_logs", updatedLogs);
  };

  // Business Action: Cancel Cita
  const handleCancelBooking = (bookingId: number) => {
    const updated = bookings.map(b => b.id === bookingId ? { ...b, status: "cancelled" } : b);
    setBookings(updated);
    updateLocalStorage("db_bookings", updated);

    // Log Activity
    const newLog = {
      id: Date.now(),
      timestamp: new Date().toTimeString().split(" ")[0],
      user: userName,
      action: "Cancelar Reserva",
      details: `Canceló la reserva #${bookingId}`
    };
    const updatedLogs = [newLog, ...activityLogs];
    setActivityLogs(updatedLogs);
    updateLocalStorage("db_logs", updatedLogs);
  };

  // Superadmin Action: Suspend / Reactivate Business
  const handleToggleSuspendBusiness = (businessId: number) => {
    const updated = businesses.map(b => b.id === businessId ? { ...b, isSuspended: !b.isSuspended } : b);
    setBusinesses(updated);
    updateLocalStorage("db_businesses", updated);

    const target = businesses.find(b => b.id === businessId);
    const actionName = target.isSuspended ? "Reactivar Negocio" : "Suspender Negocio";

    const newLog = {
      id: Date.now(),
      timestamp: new Date().toTimeString().split(" ")[0],
      user: userName,
      action: actionName,
      details: `${actionName}: ${target.name}`
    };
    const updatedLogs = [newLog, ...activityLogs];
    setActivityLogs(updatedLogs);
    updateLocalStorage("db_logs", updatedLogs);
  };

  // Superadmin Action: Eliminar Business
  const handleDeleteBusiness = (businessId: number) => {
    const target = businesses.find(b => b.id === businessId);
    const updated = businesses.filter(b => b.id !== businessId);
    setBusinesses(updated);
    updateLocalStorage("db_businesses", updated);

    const newLog = {
      id: Date.now(),
      timestamp: new Date().toTimeString().split(" ")[0],
      user: userName,
      action: "Eliminar Negocio",
      details: `Eliminó permanentemente el negocio: ${target.name}`
    };
    const updatedLogs = [newLog, ...activityLogs];
    setActivityLogs(updatedLogs);
    updateLocalStorage("db_logs", updatedLogs);
  };

  // Superadmin Action: Crear cuenta superadmin
  const handleCreateSuperadmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminUser.trim() || !newAdminPass.trim()) return;

    setShowNewAdminSuccess(true);
    setNewAdminUser("");
    setNewAdminPass("");

    const newLog = {
      id: Date.now(),
      timestamp: new Date().toTimeString().split(" ")[0],
      user: userName,
      action: "Crear Superadmin",
      details: `Creó nueva cuenta superadmin: ${newAdminUser}`
    };
    const updatedLogs = [newLog, ...activityLogs];
    setActivityLogs(updatedLogs);
    updateLocalStorage("db_logs", updatedLogs);

    setTimeout(() => setShowNewAdminSuccess(false), 3000);
  };

  // Client Action: Realizar Reserva
  const handleCreateBooking = () => {
    if (!selectedService || !selectedDate || !selectedTime) return;

    const newBooking = {
      id: Date.now(),
      date: selectedDate,
      time: selectedTime,
      customerName: userName,
      customerId: 999, // Static custom client id
      businessId: activeBookingBusiness.id,
      serviceName: selectedService.name,
      price: selectedService.price,
      status: "pending"
    };

    const updatedBookings = [newBooking, ...bookings];
    setBookings(updatedBookings);
    updateLocalStorage("db_bookings", updatedBookings);

    // Create payment as pending
    const newPayment = {
      id: Date.now() + 1,
      clientName: userName,
      businessName: activeBookingBusiness.name,
      amount: selectedService.price,
      method: "Tarjeta",
      date: selectedDate,
      status: "pending"
    };
    const updatedPayments = [newPayment, ...payments];
    setPayments(updatedPayments);
    updateLocalStorage("db_payments", updatedPayments);

    // Create Activity Log
    const newLog = {
      id: Date.now(),
      timestamp: new Date().toTimeString().split(" ")[0],
      user: userName,
      action: "Creación de Reserva",
      details: `Reservó ${selectedService.name} en ${activeBookingBusiness.name}`
    };
    const updatedLogs = [newLog, ...activityLogs];
    setActivityLogs(updatedLogs);
    updateLocalStorage("db_logs", updatedLogs);

    setShowBookingSuccess(true);
    setTimeout(() => {
      setShowBookingSuccess(false);
      setActiveBookingBusiness(null);
      setSelectedService(null);
      setSelectedDate("");
      setSelectedTime("");
    }, 2500);
  };

  if (loading) {
    return (
      <div style={{ padding: "80px", textAlign: "center", color: "var(--text-muted)" }}>
        <Activity className="spinner" size={40} style={{ margin: "0 auto 16px", color: "var(--primary)" }} />
        <p>Cargando BookFlow Premium...</p>
      </div>
    );
  }

  // --- FILTRADOS DE CLIENTE ---
  const filteredBusinesses = businesses.filter(b => {
    if (b.isSuspended) return false;
    const matchesSearch = b.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          b.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          b.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "Todos" || b.category === selectedCategory;
    const matchesCity = selectedCity === "Todos" || b.city === selectedCity;
    return matchesSearch && matchesCategory && matchesCity;
  });

  return (
    <div className="page-stack">
      
      {/* -------------------- 1. VISTA DEL CLIENTE -------------------- */}
      {userRole === "client" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="page-stack">
          
          {/* Hero Premium */}
          <section className="page-hero" style={{ background: "linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(168, 85, 247, 0.05) 100%)", border: "1px solid rgba(99, 102, 241, 0.2)" }}>
            <div style={{ maxWidth: "600px" }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(99, 102, 241, 0.15)", padding: "6px 12px", borderRadius: "20px", fontSize: "12px", color: "var(--primary)", fontWeight: "bold", marginBottom: "16px" }}>
                <Sparkles size={14} /> Descubre los mejores salones de Alicante y Elche
              </div>
              <h2 style={{ fontSize: "40px", fontWeight: "900", letterSpacing: "-0.04em", lineHeight: "1.1" }}>
                Reserva Citas Profesionales al Instante
              </h2>
              <p style={{ color: "var(--text-muted)", fontSize: "16px", marginTop: "12px" }}>
                Agenda de forma dinámica, visualiza disponibilidad en tiempo real y gestiona tus reservas desde tu panel prémium.
              </p>
            </div>
            <button className="primary-btn" onClick={() => handleDemoLogin("business")}>
              <span>Cambiar a Vista Empresa</span>
              <ChevronRight size={16} />
            </button>
          </section>

          {/* Search bar & Filters */}
          <section className="section-card" style={{ background: "rgba(255, 255, 255, 0.01)", border: "1px solid var(--border)" }}>
            <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "center" }}>
              
              {/* Buscador */}
              <div style={{ position: "relative", flex: 1, minWidth: "260px" }}>
                <Search size={18} style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input" 
                  placeholder="Buscar peluquería, masajes, fisioterapia..." 
                  style={{ paddingLeft: "48px" }}
                />
              </div>

              {/* Categoría */}
              <div style={{ width: "160px" }}>
                <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="select">
                  <option value="Todos">Categoría: Todas</option>
                  <option value="Estética">Estética</option>
                  <option value="Salud">Salud</option>
                  <option value="Bienestar">Bienestar</option>
                </select>
              </div>

              {/* Ciudad */}
              <div style={{ width: "160px" }}>
                <select value={selectedCity} onChange={(e) => setSelectedCity(e.target.value)} className="select">
                  <option value="Todos">Ciudad: Todas</option>
                  <option value="Alicante">Alicante</option>
                  <option value="Elche">Elche</option>
                </select>
              </div>

            </div>
          </section>

          {/* Business Cards Grid */}
          <section>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ fontSize: "20px", fontWeight: "700" }}>Negocios Disponibles ({filteredBusinesses.length})</h3>
            </div>

            <div className="customer-grid">
              {filteredBusinesses.map((b) => (
                <div key={b.id} className="customer-card" style={{ display: "flex", flexDirection: "column", height: "100%", gap: "16px", overflow: "hidden", padding: "0", background: "var(--surface)" }}>
                  
                  {/* Business Image banner */}
                  <div style={{ position: "relative", height: "180px", width: "100%" }}>
                    <img src={b.image} alt={b.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    <span style={{ position: "absolute", top: "12px", right: "12px", background: "rgba(11, 13, 17, 0.8)", backdropFilter: "blur(4px)", padding: "4px 8px", borderRadius: "6px", fontSize: "12px", fontWeight: "bold", display: "flex", alignItems: "center", gap: "4px", color: "var(--warning)" }}>
                      <Star size={14} fill="currentColor" /> {b.rating}
                    </span>
                    <span style={{ position: "absolute", bottom: "12px", left: "12px", background: "var(--primary-gradient)", padding: "4px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: "bold" }}>
                      {b.category}
                    </span>
                  </div>

                  {/* Info */}
                  <div style={{ padding: "0 24px 24px", display: "flex", flexDirection: "column", flex: 1, gap: "12px" }}>
                    <div>
                      <h4 style={{ fontSize: "18px", fontWeight: "bold", margin: "0" }}>{b.name}</h4>
                      <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "4px" }}>
                        <MapPin size={12} /> {b.street}, {b.city}
                      </p>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border)", paddingTop: "12px", marginTop: "auto" }}>
                      <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                        Horario: <strong>{b.hours}</strong>
                      </span>
                      
                      <button 
                        className="primary-btn" 
                        onClick={() => {
                          setActiveBookingBusiness(b);
                          setSelectedService(null);
                        }}
                        style={{ padding: "8px 16px", fontSize: "12px" }}
                      >
                        Reservar Cita
                      </button>
                    </div>
                  </div>

                </div>
              ))}
            </div>
          </section>

          {/* DYNAMIC BOOKING MODAL WITH VISUAL CALENDAR AND PRICES */}
          <AnimatePresence>
            {activeBookingBusiness && (
              <div className="modal-backdrop">
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="modal-card" style={{ maxWidth: "580px" }}>
                  
                  {showBookingSuccess ? (
                    /* SUCCESS ANIMATION */
                    <div style={{ textAlign: "center", padding: "40px 0" }}>
                      <motion.div initial={{ scale: 0 }} animate={{ scale: [0, 1.2, 1] }} transition={{ duration: 0.5 }}>
                        <CheckCircle size={80} style={{ color: "var(--success)", margin: "0 auto 24px" }} />
                      </motion.div>
                      <h3 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "8px" }}>¡Reserva Realizada con Éxito!</h3>
                      <p style={{ color: "var(--text-muted)" }}>Hemos enviado la confirmación y el ticket a tu panel de Reservas.</p>
                    </div>
                  ) : (
                    /* SELECTION SCREEN */
                    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                      
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <h3 style={{ fontSize: "20px", fontWeight: "bold", margin: "0" }}>Reservar en {activeBookingBusiness.name}</h3>
                          <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "var(--text-muted)" }}>Selecciona el servicio y fecha</p>
                        </div>
                        <button className="mobile-toggle" onClick={() => setActiveBookingBusiness(null)}>✕</button>
                      </div>

                      {/* Paso 1: Servicios del negocio */}
                      <div className={styles.field}>
                        <span className={styles.label}>1. Selecciona el Servicio</span>
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "8px" }}>
                          {services.filter(s => s.businessId === activeBookingBusiness.id).map(service => (
                            <div 
                              key={service.id}
                              onClick={() => setSelectedService(service)}
                              style={{ 
                                padding: "12px", borderRadius: "12px", border: "1px solid",
                                borderColor: selectedService?.id === service.id ? "var(--primary)" : "var(--border)",
                                background: selectedService?.id === service.id ? "rgba(99, 102, 241, 0.08)" : "rgba(255,255,255,0.01)",
                                cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center",
                                transition: "all 0.2s"
                              }}
                            >
                              <div>
                                <p style={{ margin: 0, fontSize: "14px", fontWeight: "bold" }}>{service.name}</p>
                                <p style={{ margin: 0, fontSize: "12px", color: "var(--text-muted)" }}>Duración: {service.duration} minutos</p>
                              </div>
                              <span style={{ fontSize: "14px", fontWeight: "bold", color: "var(--primary)" }}>{service.price} €</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Paso 2: Calendario Visual y Horas */}
                      {selectedService && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                          
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                            {/* Fecha */}
                            <div>
                              <span className={styles.label}>2. Selecciona Fecha</span>
                              <input 
                                type="date" 
                                min="2026-05-27"
                                max="2026-06-30"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="input" 
                                style={{ marginTop: "6px" }}
                              />
                            </div>
                            
                            {/* Hora */}
                            <div>
                              <span className={styles.label}>3. Elige Hora disponible</span>
                              <select 
                                value={selectedTime}
                                onChange={(e) => setSelectedTime(e.target.value)}
                                className="select" 
                                style={{ marginTop: "6px" }}
                              >
                                <option value="">Elige hora</option>
                                <option value="09:30">09:30</option>
                                <option value="10:30">10:30</option>
                                <option value="12:00">12:00</option>
                                <option value="16:00">16:00</option>
                                <option value="17:30">17:30</option>
                              </select>
                            </div>
                          </div>

                          {/* Precio Total Box */}
                          <div style={{ background: "rgba(255,255,255,0.03)", padding: "16px", borderRadius: "12px", border: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "10px" }}>
                            <div>
                              <p style={{ margin: 0, fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase" }}>Total a Pagar en Local</p>
                              <p style={{ margin: 0, fontSize: "18px", fontWeight: "bold" }}>{selectedService.name}</p>
                            </div>
                            <span style={{ fontSize: "22px", fontWeight: "bold", color: "var(--primary)" }}>{selectedService.price} €</span>
                          </div>

                          <button 
                            className="primary-btn" 
                            disabled={!selectedDate || !selectedTime}
                            onClick={handleCreateBooking}
                            style={{ width: "100%", justifyContent: "center", marginTop: "10px" }}
                          >
                            <span>Confirmar Reserva</span>
                          </button>

                        </motion.div>
                      )}

                    </div>
                  )}

                </motion.div>
              </div>
            )}
          </AnimatePresence>

        </motion.div>
      )}

      {/* -------------------- 2. VISTA DEL NEGOCIO (Ya implementada anteriormente y pulida) -------------------- */}
      {userRole === "business" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="page-stack">
          
          <section className="page-hero">
            <div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(16, 185, 129, 0.15)", padding: "6px 12px", borderRadius: "20px", fontSize: "12px", color: "var(--success)", fontWeight: "bold", marginBottom: "12px" }}>
                <CheckCircle size={14} /> Abierto y operativo hoy
              </div>
              <h2>Salón Alicante Futura</h2>
              <p>Monitorea y gestiona tus reservas corporativas.</p>
            </div>
            
            <div style={{ display: "flex", gap: "12px" }}>
              <button className="secondary-btn" onClick={() => handleDemoLogin("client")}>
                <span>Cambiar a Cliente</span>
              </button>
              <button className="primary-btn" onClick={() => window.print()}>
                <span>Exportar Informe</span>
              </button>
            </div>
          </section>

          {/* KPIs */}
          <section className="kpi-grid">
            <div className="kpi-card">
              <p className="kpi-card__label">Reservas Hoy</p>
              <h3 className="kpi-card__value">4</h3>
              <p className="kpi-card__meta kpi-card__meta--positive">
                <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                  <TrendingUp size={14} /> +25% vs ayer
                </span>
              </p>
            </div>
            <div className="kpi-card">
              <p className="kpi-card__label">Facturación Mensual</p>
              <h3 className="kpi-card__value">1.420 €</h3>
              <p className="kpi-card__meta kpi-card__meta--positive">
                <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                  <TrendingUp size={14} /> +12% vs mes anterior
                </span>
              </p>
            </div>
            <div className="kpi-card">
              <p className="kpi-card__label">Tasa de Cancelación</p>
              <h3 className="kpi-card__value" style={{ color: "var(--accent)" }}>4.2%</h3>
              <p className="kpi-card__meta" style={{ color: "var(--text-muted)" }}>
                <span>Excelente estado</span>
              </p>
            </div>
            <div className="kpi-card">
              <p className="kpi-card__label">Clientes Activos</p>
              <h3 className="kpi-card__value">86</h3>
              <p className="kpi-card__meta kpi-card__meta--positive">
                <span>Base de datos en crecimiento</span>
              </p>
            </div>
          </section>

          {/* Business Admin Citas list */}
          <section className="section-card">
            <h3 style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "20px" }}>Gestión e Historial de Reservas</h3>
            
            <div className="table-scroll-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th>Servicio</th>
                    <th>Fecha / Hora</th>
                    <th>Precio</th>
                    <th>Estado</th>
                    <th style={{ textAlign: "right" }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map(b => (
                    <tr key={b.id}>
                      <td style={{ fontWeight: "bold" }}>{b.customerName}</td>
                      <td>{b.serviceName}</td>
                      <td>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                          <Clock size={14} style={{ color: "var(--primary)" }} /> {b.date} a las {b.time}
                        </span>
                      </td>
                      <td style={{ fontWeight: "bold" }}>{b.price} €</td>
                      <td>
                        <span className={`badge badge--${b.status}`}>{b.status}</span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        {b.status === "pending" && (
                          <div style={{ display: "inline-flex", gap: "8px" }}>
                            <button className="primary-btn" onClick={() => handleConfirmBooking(b.id)} style={{ padding: "6px 12px", fontSize: "11px", background: "var(--success)", boxShadow: "none" }}>
                              Confirmar
                            </button>
                            <button className="danger-btn" onClick={() => handleCancelBooking(b.id)} style={{ padding: "6px 12px", fontSize: "11px" }}>
                              Rechazar
                            </button>
                          </div>
                        )}
                        {b.status === "confirmed" && (
                          <button className="secondary-btn" onClick={() => handleCancelBooking(b.id)} style={{ padding: "6px 12px", fontSize: "11px" }}>
                            Cancelar Cita
                          </button>
                        )}
                        {b.status === "cancelled" && (
                          <span style={{ fontSize: "12px", color: "var(--text-muted)", fontStyle: "italic" }}>Cancelada</span>
                        )}
                        {b.status === "completed" && (
                          <span style={{ fontSize: "12px", color: "var(--success)", fontWeight: "bold" }}>✓ Completada y Pagada</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

        </motion.div>
      )}

      {/* -------------------- 3. VISTA DEL SUPERADMIN (Plataforma Global) -------------------- */}
      {userRole === "superadmin" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="page-stack">
          
          <section className="page-hero" style={{ background: "linear-gradient(135deg, rgba(244, 63, 94, 0.08) 0%, rgba(99, 102, 241, 0.04) 100%)", border: "1px solid rgba(255, 255, 255, 0.05)" }}>
            <div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(99, 102, 241, 0.15)", padding: "6px 12px", borderRadius: "20px", fontSize: "12px", color: "var(--primary)", fontWeight: "bold", marginBottom: "12px" }}>
                <ShieldCheck size={14} /> Control Maestro de Plataforma Activo
              </div>
              <h2>Consola de Superadministrador</h2>
              <p>Gestión global de negocios, auditorías técnicas, seguridad y métricas financieras.</p>
            </div>
            
            <button className="secondary-btn" onClick={() => handleDemoLogin("client")} style={{ border: "1px solid var(--primary)", color: "var(--primary)" }}>
              <span>Ir a Vista Cliente</span>
            </button>
          </section>

          {/* Global platform statistics */}
          <section className="kpi-grid">
            <div className="kpi-card" style={{ background: "rgba(255, 255, 255, 0.02)" }}>
              <p className="kpi-card__label">Negocios Totales</p>
              <h3 className="kpi-card__value">{businesses.length}</h3>
              <p className="kpi-card__meta" style={{ color: "var(--text-muted)" }}>Salones registrados</p>
            </div>
            <div className="kpi-card" style={{ background: "rgba(255, 255, 255, 0.02)" }}>
              <p className="kpi-card__label">Volumen de Transacciones</p>
              <h3 className="kpi-card__value" style={{ color: "var(--primary)" }}>3.840 €</h3>
              <p className="kpi-card__meta kpi-card__meta--positive">Semana actual</p>
            </div>
            <div className="kpi-card" style={{ background: "rgba(255, 255, 255, 0.02)" }}>
              <p className="kpi-card__label">Logs de Auditoría</p>
              <h3 className="kpi-card__value">{activityLogs.length}</h3>
              <p className="kpi-card__meta" style={{ color: "var(--text-muted)" }}>Acciones registradas</p>
            </div>
            <div className="kpi-card" style={{ background: "rgba(255, 255, 255, 0.02)" }}>
              <p className="kpi-card__label">Estado del Sistema</p>
              <h3 className="kpi-card__value" style={{ color: "var(--success)" }}>99.9%</h3>
              <p className="kpi-card__meta kpi-card__meta--positive">Operativo</p>
            </div>
          </section>

          {/* Superadmin: Business administration and status */}
          <section className="section-card">
            <h3 style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "20px" }}>Gestión de Negocios y Estado</h3>
            
            <div className="table-scroll-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Negocio</th>
                    <th>Categoría</th>
                    <th>Ubicación</th>
                    <th>Fecha de Alta</th>
                    <th>Estado de Cuenta</th>
                    <th style={{ textAlign: "right" }}>Acciones Administrativas</th>
                  </tr>
                </thead>
                <tbody>
                  {businesses.map(b => (
                    <tr key={b.id}>
                      <td style={{ fontWeight: "bold" }}>{b.name}</td>
                      <td>{b.category}</td>
                      <td>{b.city}</td>
                      <td>{b.createdAt}</td>
                      <td>
                        {b.isSuspended ? (
                          <span className="badge" style={{ background: "rgba(244, 63, 94, 0.15)", color: "#f43f5e", border: "1px solid rgba(244, 63, 94, 0.2)" }}>SUSPENDIDO</span>
                        ) : (
                          <span className="badge" style={{ background: "rgba(16, 185, 129, 0.15)", color: "var(--success)", border: "1px solid rgba(16, 185, 129, 0.2)" }}>ACTIVO</span>
                        )}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div style={{ display: "inline-flex", gap: "8px" }}>
                          
                          {/* Suspender / Reactivar */}
                          <button 
                            className="secondary-btn" 
                            onClick={() => handleToggleSuspendBusiness(b.id)}
                            style={{ 
                              padding: "6px 12px", fontSize: "11px", 
                              color: b.isSuspended ? "var(--success)" : "var(--warning)",
                              borderColor: b.isSuspended ? "rgba(16,185,129,0.3)" : "rgba(245,158,11,0.3)"
                            }}
                          >
                            <Ban size={12} style={{ marginRight: "4px" }} />
                            {b.isSuspended ? "Reactivar" : "Suspender"}
                          </button>

                          {/* Eliminar permanentemente */}
                          <button 
                            className="danger-btn" 
                            onClick={() => handleDeleteBusiness(b.id)}
                            style={{ padding: "6px 12px", fontSize: "11px" }}
                          >
                            <Trash2 size={12} style={{ marginRight: "4px" }} />
                            Eliminar
                          </button>

                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Bottom Grid: Create Superadmin & System Logs */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "24px" }}>
            
            {/* Create other superadmin credentials */}
            <section className="section-card">
              <h3 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                <UserCheck size={20} style={{ color: "var(--primary)" }} /> Registrar Nuevo Superadmin
              </h3>
              
              <form onSubmit={handleCreateSuperadmin} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "12px", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>Usuario</label>
                  <input type="text" value={newAdminUser} onChange={(e) => setNewAdminUser(e.target.value)} className="input" placeholder="Nombre de usuario" />
                </div>
                <div>
                  <label style={{ fontSize: "12px", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>Contraseña</label>
                  <input type="password" value={newAdminPass} onChange={(e) => setNewAdminPass(e.target.value)} className="input" placeholder="Contraseña de acceso" />
                </div>

                {showNewAdminSuccess && (
                  <div className="success" style={{ padding: "8px 12px", fontSize: "12px" }}>
                    ✓ Superadministrador registrado correctamente.
                  </div>
                )}

                <button type="submit" className="primary-btn" style={{ justifyContent: "center", padding: "12px" }}>
                  <Plus size={16} /> Registrar Administrador
                </button>
              </form>
            </section>

            {/* Technical audit logs dashboard */}
            <section className="section-card">
              <h3 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                <FileCode2 size={20} style={{ color: "var(--primary)" }} /> Registro Técnico del Servidor (Logs)
              </h3>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "250px", overflowY: "auto", paddingRight: "4px", fontFamily: "Courier New, monospace" }}>
                {activityLogs.map(log => (
                  <div key={log.id} style={{ background: "rgba(255,255,255,0.02)", padding: "8px 12px", borderRadius: "6px", border: "1px solid var(--border)", fontSize: "12px" }}>
                    <span style={{ color: "var(--text-muted)" }}>[{log.timestamp}]</span>{" "}
                    <strong style={{ color: "var(--primary)" }}>{log.user}</strong>:{" "}
                    <span style={{ fontWeight: "bold" }}>{log.action}</span> - {log.details}
                  </div>
                ))}
              </div>
            </section>

          </div>

        </motion.div>
      )}

      {/* FOOTER */}
      <footer style={{ marginTop: "40px", paddingTop: "20px", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", color: "var(--text-muted)", fontSize: "13px" }}>
        <span>BookFlow Premium &copy; 2026</span>
        <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
          <span>Sesión activa como: <strong>{userName}</strong> ({userRole})</span>
          <button onClick={handleLogout} className="secondary-btn" style={{ padding: "6px 12px", fontSize: "12px", color: "var(--accent)", borderColor: "rgba(244,63,94,0.2)" }}>
            <LogOut size={12} style={{ marginRight: "4px" }} />
            Cerrar Sesión
          </button>
        </div>
      </footer>

    </div>
  );
}
