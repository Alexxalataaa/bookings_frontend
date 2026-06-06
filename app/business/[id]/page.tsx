"use client";

import { useEffect, useState, use, useMemo } from "react";
import { addMinutes, format, isBefore, setHours, setMinutes } from "date-fns";
import { useRouter } from "next/navigation";
import { 
  getBusiness, 
  createAppointment, 
  BookingStatus, 
  Business, 
  Service, 
  createPayment,
  getSpots,
  Spot
} from "@/lib/api";
import { CheckCircle2, ChevronLeft, Calendar as CalendarIcon, MapPin, Building, Activity, ChevronRight, X, Phone, Mail, Clock, Star, Globe, Sparkles, CheckCircle, AlertCircle, ArrowLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { es } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function BusinessLandingPage({ params }: PageProps) {
  const router = useRouter();
  const { id } = use(params);

  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Booking states
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  // Visual map states
  const [spots, setSpots] = useState<Spot[]>([]);
  const [spotsLoading, setSpotsLoading] = useState(false);
  const [selectedSpot, setSelectedSpot] = useState<Spot | null>(null);
  
  // Guest booking forms (in case client is not logged in)
  const [isGuest, setIsGuest] = useState(true);
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem("auth_token");
    if (token) {
      setIsGuest(false);
      setGuestName(localStorage.getItem("user_name") || "");
    }

    fetchBusinessData();
  }, [id]);

  // Load spots when date+time is selected
  useEffect(() => {
    if (!business || !selectedDate || !selectedTime) {
      setSpots([]);
      setSelectedSpot(null);
      return;
    }
    setSpotsLoading(true);
    getSpots(business.id, selectedDate, selectedTime)
      .then(data => {
        setSpots(data || []);
        setSelectedSpot(null);
      })
      .catch(() => setSpots([]))
      .finally(() => setSpotsLoading(false));
  }, [business, selectedDate, selectedTime]);

  const availableSlots = useMemo(() => {
    if (!selectedDate || !business || !business.hours) return [];
    let hoursObj: any = {};
    try {
      hoursObj = JSON.parse(business.hours);
    } catch {
      return [];
    }
    
    const [year, month, day] = selectedDate.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    const dayIndex = date.getDay();
    
    let dayKey = "";
    if (dayIndex >= 1 && dayIndex <= 5) dayKey = "monFri";
    else if (dayIndex === 6) dayKey = "sat";
    else if (dayIndex === 0) dayKey = "sun";
    
    const timeRange = hoursObj[dayKey];
    if (!timeRange || timeRange.toLowerCase() === "cerrado") return [];
    
    const [startStr, endStr] = timeRange.split("-").map((s: string) => s.trim());
    if (!startStr || !endStr) return [];
    
    const [startH, startM] = startStr.split(":").map(Number);
    const [endH, endM] = endStr.split(":").map(Number);
    
    let current = setMinutes(setHours(date, startH), startM);
    const endTime = setMinutes(setHours(date, endH), endM);
    
    const slots: string[] = [];
    const now = new Date();
    
    while (isBefore(current, endTime)) {
      if (current > now) {
        slots.push(format(current, "HH:mm"));
      }
      current = addMinutes(current, 30);
    }
    return slots;
  }, [selectedDate, business]);

  async function fetchBusinessData() {
    try {
      setLoading(true);
      setError(null);
      const data = await getBusiness(id);
      setBusiness(data);
    } catch (err: any) {
      console.error(err);
      setError("No se pudo cargar la información del negocio.");
    } finally {
      setLoading(false);
    }
  }

  // Parse hours, gallery, socialLinks
  const hours = business?.hours ? JSON.parse(business.hours) : { monFri: "09:00 - 18:00", sat: "09:00 - 14:00", sun: "Cerrado" };
  const gallery = business?.gallery ? JSON.parse(business.gallery) : [];
  const socialLinks = business?.socialLinks ? JSON.parse(business.socialLinks) : { instagram: "", facebook: "" };

  const handleBookService = async () => {
    if (!selectedService || !selectedDate || !selectedTime) return;
    
    setBookingLoading(true);
    setAuthError(null);

    try {
      let token = localStorage.getItem("auth_token");
      let clientId = 999; // Fallback customer ID

      // If user is guest, we will register/log them in as a temporary customer or guest account
      if (isGuest) {
        if (!guestName.trim() || !guestPhone.trim() || !guestEmail.trim()) {
          setAuthError("Por favor completa tus datos para agendar la cita.");
          setBookingLoading(false);
          return;
        }

        // Auto-login or register guest
        const regRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fullName: guestName,
            email: guestEmail,
            username: "guest_" + Date.now().toString().slice(-4),
            password: "GuestPassword123!",
            role: "client",
          }),
        });

        const regData = await regRes.json();
        // If they exist or error, try logging in
        let loginToken = "";
        if (regRes.ok && regData.tempToken) {
          // Verify automatically for frictionless guest experience
          await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}/auth/verify-register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tempToken: regData.tempToken, code: "123456" }), // simulated code
          });
        }
        
        const loginRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: guestEmail, password: "GuestPassword123!" }),
        });
        
        if (loginRes.ok) {
          const loginData = await loginRes.json();
          token = loginData.token;
          localStorage.setItem("auth_token", token!);
          localStorage.setItem("user_role", loginData.user.role);
          localStorage.setItem("user_name", loginData.user.fullName);
          setIsGuest(false);
        }
      }

      // Create booking on backend
      const bookingData = {
        date: selectedDate,
        time: selectedTime,
        status: "pending" as BookingStatus,
        businessId: business!.id,
        serviceName: selectedService.name,
        serviceId: selectedService.id,
        spotId: selectedSpot?.id,
      };

      await createAppointment(bookingData as any);

      // Create associated payment on backend
      await createPayment({
        clientName: guestName || "Cliente",
        businessName: business!.name,
        amount: selectedService.price,
        method: "Tarjeta",
        date: selectedDate,
        businessId: business!.id,
      });

      setBookingSuccess(true);
      setTimeout(() => {
        setBookingSuccess(false);
        setSelectedService(null);
        setSelectedDate("");
        setSelectedTime("");
      }, 2500);
    } catch (err: any) {
      console.error(err);
      setAuthError(err.message || "Error al registrar la reserva.");
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0b0d11", color: "#f8fafc" }}>
        <div style={{ textAlign: "center" }}>
          <div className="spinner" style={{ width: "40px", height: "40px", border: "3px solid rgba(99,102,241,0.2)", borderTopColor: "var(--primary)", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 16px" }} />
          <p style={{ color: "#94a3b8" }}>Cargando página de negocio...</p>
        </div>
      </div>
    );
  }

  if (error || !business) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0b0d11", color: "#f8fafc", padding: "20px" }}>
        <div className="section-card" style={{ maxWidth: "480px", textAlign: "center", border: "1px solid rgba(244,63,94,0.2)" }}>
          <AlertCircle size={48} style={{ color: "#f43f5e", margin: "0 auto 16px" }} />
          <h2 style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "8px" }}>Error al cargar</h2>
          <p style={{ color: "#94a3b8", marginBottom: "20px" }}>{error || "El negocio solicitado no existe."}</p>
          <Link href="/dashboard" className="primary-btn" style={{ justifyContent: "center" }}>
            <ArrowLeft size={16} /> Volver al buscador
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: "#0b0d11", color: "#f8fafc", minHeight: "100vh" }}>
      {/* 1. HERO BANNER */}
      <section style={{ position: "relative", height: "360px", width: "100%", overflow: "hidden" }}>
        <img 
          src={business.image || "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1200&auto=format&fit=crop&q=80"} 
          alt={business.name} 
          style={{ width: "100%", height: "100%", objectFit: "cover" }} 
        />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(11,13,17,0.1) 0%, rgba(11,13,17,0.95) 100%)" }} />
        
        {/* Back Button */}
        <Link href="/dashboard" style={{ position: "absolute", top: "24px", left: "24px", display: "flex", alignItems: "center", gap: "8px", background: "rgba(11, 13, 17, 0.6)", padding: "10px 16px", borderRadius: "30px", border: "1px solid rgba(255,255,255,0.1)", fontSize: "14px", fontWeight: "bold", textDecoration: "none", color: "#ffffff", backdropFilter: "blur(8px)", transition: "all 0.3s" }}>
          <ArrowLeft size={16} />
          Volver
        </Link>
      </section>

      {/* 2. PROFILE CONTAINER & MAIN GRID */}
      <div style={{ maxWidth: "1200px", margin: "-120px auto 0", padding: "0 24px 60px", position: "relative", zIndex: 10 }}>
        
        {/* Header Block */}
        <div style={{ display: "flex", gap: "24px", alignItems: "flex-end", flexWrap: "wrap", marginBottom: "40px" }}>
          <img 
            src={business.logo || "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=200&auto=format&fit=crop&q=80"} 
            alt="Logo" 
            style={{ width: "140px", height: "140px", borderRadius: "24px", objectFit: "cover", border: "4px solid #0b0d11", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.3)" }} 
          />
          <div style={{ flex: 1, minWidth: "280px", paddingBottom: "10px" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(99,102,241,0.15)", color: "#818cf8", fontSize: "13px", fontWeight: "bold", padding: "6px 12px", borderRadius: "30px", marginBottom: "12px" }}>
              <Sparkles size={14} /> {business.category}
            </span>
            <h1 style={{ fontSize: "36px", fontWeight: "900", letterSpacing: "-0.03em", margin: "0 0 8px 0", lineHeight: 1.1 }}>{business.name}</h1>
            
            <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap", color: "#94a3b8", fontSize: "14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <MapPin size={16} style={{ color: "#6366f1" }} />
                <span>{business.street}, {business.city}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <Star size={16} fill="#fbbf24" stroke="#fbbf24" />
                <span style={{ color: "#f8fafc", fontWeight: "bold" }}>{business.rating}</span>
                <span>({business.reviewsCount} reseñas)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content Layout Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "32px" }} className="business-grid-layout">
          
          {/* LEFT: Services & Media */}
          <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
            
            {/* Description */}
            <section className="section-card" style={{ background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.05)" }}>
              <h3 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "12px" }}>Sobre Nosotros</h3>
              <p style={{ color: "#94a3b8", fontSize: "15px", lineHeight: 1.6, margin: 0 }}>
                {business.description || "Bienvenidos a nuestro salón premium. Ofrecemos servicios profesionales con personal altamente capacitado, garantizando una experiencia exclusiva y de máxima calidad en cada cita."}
              </p>
            </section>

            {/* Public Services List */}
            <section className="section-card" style={{ background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.05)" }}>
              <h3 style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "20px" }}>Nuestros Servicios</h3>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {business.services && business.services.length > 0 ? (
                  business.services.map((service) => (
                    <div 
                      key={service.id} 
                      style={{ 
                        display: "flex", 
                        justifyContent: "space-between", 
                        alignItems: "center", 
                        padding: "20px", 
                        borderRadius: "16px", 
                        background: "rgba(255,255,255,0.02)", 
                        border: "1px solid rgba(255,255,255,0.04)",
                        transition: "all 0.3s"
                      }}
                      className="service-list-item"
                    >
                      <div style={{ flex: 1, paddingRight: "20px" }}>
                        <h4 style={{ margin: "0 0 6px 0", fontSize: "16px", fontWeight: "bold", color: "#f8fafc" }}>{service.name}</h4>
                        <p style={{ margin: "0 0 8px 0", fontSize: "13px", color: "#94a3b8" }}>{service.description || "Servicio premium adaptado a tus necesidades."}</p>
                        <span style={{ fontSize: "13px", color: "#818cf8", fontWeight: "bold", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                          <Clock size={14} /> {service.duration} min
                        </span>
                      </div>
                      
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "12px" }}>
                        <span style={{ fontSize: "20px", fontWeight: "900", color: "#ffffff" }}>{service.price} €</span>
                        <button 
                          onClick={() => {
                            setSelectedService(service);
                            setSelectedDate("");
                            setSelectedTime("");
                          }}
                          className="primary-btn" 
                          style={{ padding: "8px 16px", fontSize: "12px" }}
                        >
                          Elegir
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p style={{ color: "#94a3b8", textAlign: "center", padding: "20px 0" }}>No hay servicios cargados en este momento.</p>
                )}
              </div>
            </section>

            {/* Gallery Images */}
            {gallery.length > 0 && (
              <section className="section-card" style={{ background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.05)" }}>
                <h3 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "16px" }}>Galería de Fotos</h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px" }}>
                  {gallery.map((img: string, idx: number) => (
                    <div key={idx} style={{ height: "130px", borderRadius: "12px", overflow: "hidden" }}>
                      <img src={img} alt={`Gallery ${idx}`} style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.3s" }} className="gallery-thumb" />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Reviews */}
            <section className="section-card" style={{ background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.05)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <h3 style={{ fontSize: "18px", fontWeight: "bold", margin: 0 }}>Opiniones de Clientes</h3>
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <Star size={16} fill="#fbbf24" stroke="#fbbf24" />
                  <span style={{ fontWeight: "bold" }}>{business.rating} / 5</span>
                </div>
              </div>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div style={{ padding: "16px", borderRadius: "12px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                    <span style={{ fontWeight: "bold", fontSize: "13px" }}>Elena Martínez</span>
                    <div style={{ display: "flex", gap: "2px" }}><Star size={12} fill="#fbbf24" stroke="#fbbf24" /><Star size={12} fill="#fbbf24" stroke="#fbbf24" /><Star size={12} fill="#fbbf24" stroke="#fbbf24" /><Star size={12} fill="#fbbf24" stroke="#fbbf24" /><Star size={12} fill="#fbbf24" stroke="#fbbf24" /></div>
                  </div>
                  <p style={{ margin: 0, fontSize: "13px", color: "#94a3b8" }}>El servicio fue excelente. Muy profesionales y el resultado me encantó. Sin duda repetiré.</p>
                </div>
                <div style={{ padding: "16px", borderRadius: "12px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                    <span style={{ fontWeight: "bold", fontSize: "13px" }}>Carlos Gómez</span>
                    <div style={{ display: "flex", gap: "2px" }}><Star size={12} fill="#fbbf24" stroke="#fbbf24" /><Star size={12} fill="#fbbf24" stroke="#fbbf24" /><Star size={12} fill="#fbbf24" stroke="#fbbf24" /><Star size={12} fill="#fbbf24" stroke="#fbbf24" /><Star size={12} fill="#e5e7eb" stroke="#e5e7eb" /></div>
                  </div>
                  <p style={{ margin: 0, fontSize: "13px", color: "#94a3b8" }}>Trato estupendo, rapidez y gran técnica. Muy fácil reservar a través de la web.</p>
                </div>
              </div>
            </section>

          </div>

          {/* RIGHT: Contact, Opening Hours & Booking Drawer */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            
            {/* Interactive booking window */}
            {selectedService && (
              <motion.section 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                className="section-card" 
                style={{ 
                  border: "2px solid #6366f1", 
                  background: "linear-gradient(135deg, rgba(99,102,241,0.05) 0%, rgba(11,13,17,0.8) 100%)",
                  boxShadow: "0 20px 25px -5px rgba(99,102,241, 0.15)"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <h3 style={{ fontSize: "16px", fontWeight: "bold", margin: 0, color: "#818cf8" }}>Confirmar Cita</h3>
                  <button onClick={() => setSelectedService(null)} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: "16px" }}>✕</button>
                </div>

                <div style={{ marginBottom: "16px", padding: "12px", background: "rgba(255,255,255,0.03)", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <p style={{ margin: "0 0 2px 0", fontSize: "11px", color: "#94a3b8", textTransform: "uppercase" }}>Servicio</p>
                  <p style={{ margin: 0, fontSize: "15px", fontWeight: "bold" }}>{selectedService.name}</p>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: "8px", fontSize: "13px" }}>
                    <span style={{ color: "#94a3b8" }}>{selectedService.duration} min</span>
                    <strong style={{ color: "#818cf8" }}>{selectedService.price} €</strong>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" }}>
                  <div>
                    <label style={{ fontSize: "12px", fontWeight: "bold", color: "#94a3b8", display: "block", marginBottom: "4px" }}>1. Fecha</label>
                    <input 
                      type="date" 
                      min={new Date().toISOString().split("T")[0]}
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="input"
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: "12px", fontWeight: "bold", color: "#94a3b8", display: "block", marginBottom: "4px" }}>2. Hora disponible</label>
                    <select 
                      value={selectedTime}
                      onChange={(e) => setSelectedTime(e.target.value)}
                      className="select"
                      disabled={!selectedDate || availableSlots.length === 0}
                    >
                      <option value="">{availableSlots.length > 0 ? "Elige hora" : "Sin horarios disponibles"}</option>
                      {availableSlots.map(slot => (
                        <option key={slot} value={slot}>{slot}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Visual Spot Map */}
                {selectedDate && selectedTime && (
                  <div style={{ marginBottom: "20px" }}>
                    <label style={{ fontSize: "12px", fontWeight: "bold", color: "#94a3b8", display: "block", marginBottom: "10px" }}>3. Puesto (opcional)</label>
                    {spotsLoading ? (
                      <div style={{ textAlign: "center", padding: "16px", color: "#94a3b8", fontSize: "13px" }}>Cargando puestos...</div>
                    ) : spots.length === 0 ? (
                      <div style={{ textAlign: "center", padding: "10px", color: "#94a3b8", fontSize: "12px", background: "rgba(255,255,255,0.02)", borderRadius: "8px" }}>Sin puestos configurados</div>
                    ) : (
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px", fontSize: "11px", color: "#94a3b8" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <div style={{ width: "12px", height: "12px", borderRadius: "3px", background: "rgba(255,255,255,0.05)", border: "1px dashed rgba(255,255,255,0.15)" }} />
                            Libre
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <div style={{ width: "12px", height: "12px", borderRadius: "3px", background: "rgba(244,63,94,0.15)", border: "1px solid rgba(244,63,94,0.3)" }} />
                            Ocupado
                          </div>
                        </div>

                        <div style={{ background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "12px", padding: "12px", overflowX: "auto" }}>
                          {/* Column Labels */}
                          <div style={{ display: "grid", gridTemplateColumns: `24px repeat(${business.mapCols || 8}, 1fr)`, gap: "4px", marginBottom: "4px", minWidth: "max-content" }}>
                            <div />
                            {Array.from({ length: business.mapCols || 8 }, (_, i) => (
                              <div key={i} style={{ textAlign: "center", fontSize: "10px", color: "var(--text-muted)", fontWeight: 700 }}>{i + 1}</div>
                            ))}
                          </div>

                          {/* Grid Rows */}
                          {Array.from({ length: business.mapRows || 6 }, (_, rowIdx) => (
                            <div key={rowIdx} style={{ display: "grid", gridTemplateColumns: `24px repeat(${business.mapCols || 8}, 1fr)`, gap: "4px", marginBottom: "4px", minWidth: "max-content" }}>
                              {/* Row Label */}
                              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", color: "var(--text-muted)", fontWeight: 700 }}>
                                {String.fromCharCode(65 + rowIdx)}
                              </div>

                              {Array.from({ length: business.mapCols || 8 }, (_, colIdx) => {
                                const spot = spots.find(s => s.posX === colIdx && s.posY === rowIdx);
                                return (
                                  <button
                                    key={colIdx}
                                    type="button"
                                    onClick={() => spot && spot.available !== false && setSelectedSpot(selectedSpot?.id === spot.id ? null : spot)}
                                    disabled={!spot || spot.available === false}
                                    style={{
                                      height: "48px",
                                      minWidth: "48px",
                                      borderRadius: "8px",
                                      border: !spot
                                        ? "1px dashed rgba(255,255,255,0.05)"
                                        : spot.available === false
                                          ? "1px solid rgba(244,63,94,0.3)"
                                          : selectedSpot?.id === spot.id
                                            ? `2px solid ${spot.color || "#6366f1"}`
                                            : `1px solid ${spot.color || "#6366f1"}40`,
                                      background: !spot
                                        ? "transparent"
                                        : spot.available === false
                                          ? "rgba(244,63,94,0.08)"
                                          : selectedSpot?.id === spot.id
                                            ? `${spot.color || "#6366f1"}22`
                                            : "rgba(255,255,255,0.02)",
                                      cursor: !spot ? "default" : spot.available === false ? "not-allowed" : "pointer",
                                      display: "flex",
                                      flexDirection: "column",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      gap: "2px",
                                      transition: "all 0.2s",
                                      opacity: spot?.available === false ? 0.6 : 1,
                                    }}
                                  >
                                    {spot && (
                                      <>
                                        <div style={{
                                          width: "20px", height: "20px", borderRadius: "6px",
                                          background: spot.available === false ? "#f43f5e" : spot.color || "#6366f1",
                                          display: "flex", alignItems: "center", justifyContent: "center",
                                          fontSize: "9px", fontWeight: 900, color: "#fff",
                                        }}>
                                          {spot.label || spot.name.charAt(0).toUpperCase()}
                                        </div>
                                        <span style={{ fontSize: "8px", color: spot.available === false ? "#f43f5e" : "var(--text-muted)", maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", padding: "0 2px" }}>
                                          {spot.name}
                                        </span>
                                      </>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          ))}
                        </div>
                        {selectedSpot && (
                          <div style={{ marginTop: "8px", fontSize: "12px", color: "#818cf8", display: "flex", alignItems: "center", gap: "6px" }}>
                            ✓ Puesto seleccionado: <strong>{selectedSpot.name}</strong>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Guest user form */}
                {isGuest && (
                  <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "16px", marginBottom: "20px", display: "flex", flexDirection: "column", gap: "10px" }}>
                    <p style={{ margin: "0 0 6px 0", fontSize: "12px", color: "#818cf8", fontWeight: "bold" }}>3. Datos del Cliente</p>
                    <input 
                      type="text" 
                      placeholder="Nombre completo" 
                      value={guestName} 
                      onChange={(e) => setGuestName(e.target.value)} 
                      className="input" 
                      style={{ padding: "8px 12px", fontSize: "13px" }}
                    />
                    <input 
                      type="tel" 
                      placeholder="Número de Teléfono" 
                      value={guestPhone} 
                      onChange={(e) => setGuestPhone(e.target.value)} 
                      className="input" 
                      style={{ padding: "8px 12px", fontSize: "13px" }}
                    />
                    <input 
                      type="email" 
                      placeholder="Correo Electrónico" 
                      value={guestEmail} 
                      onChange={(e) => setGuestEmail(e.target.value)} 
                      className="input" 
                      style={{ padding: "8px 12px", fontSize: "13px" }}
                    />
                  </div>
                )}

                {authError && (
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#f43f5e", fontSize: "12px", marginBottom: "12px", padding: "8px", background: "rgba(244,63,94,0.1)", borderRadius: "6px" }}>
                    <AlertCircle size={14} />
                    <span>{authError}</span>
                  </div>
                )}

                {bookingSuccess ? (
                  <div style={{ textAlign: "center", padding: "12px 0", color: "#10b981", fontWeight: "bold", fontSize: "14px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                    <CheckCircle size={18} />
                    <span>¡Reserva completada!</span>
                  </div>
                ) : (
                  <button 
                    disabled={!selectedDate || !selectedTime || bookingLoading}
                    onClick={handleBookService}
                    className="primary-btn" 
                    style={{ width: "100%", justifyContent: "center" }}
                  >
                    {bookingLoading ? "Cargando..." : "Agendar Cita"}
                  </button>
                )}
              </motion.section>
            )}

            {/* Opening Hours */}
            <section className="section-card" style={{ background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.05)" }}>
              <h3 style={{ fontSize: "16px", fontWeight: "bold", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                <Clock size={18} style={{ color: "#6366f1" }} /> Horario de Apertura
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#94a3b8" }}>Lunes a Viernes:</span>
                  <span style={{ fontWeight: "bold" }}>{hours.monFri || "09:00 - 20:00"}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#94a3b8" }}>Sábados:</span>
                  <span style={{ fontWeight: "bold" }}>{hours.sat || "09:00 - 14:00"}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#94a3b8" }}>Domingos:</span>
                  <span style={{ fontWeight: "bold" }}>{hours.sun || "Cerrado"}</span>
                </div>
              </div>
            </section>

            {/* Contact details */}
            <section className="section-card" style={{ background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.05)" }}>
              <h3 style={{ fontSize: "16px", fontWeight: "bold", marginBottom: "16px" }}>Contacto</h3>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "14px", fontSize: "14px" }}>
                {business.phone && (
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <Phone size={16} style={{ color: "#6366f1" }} />
                    <span style={{ color: "#94a3b8" }}>{business.phone}</span>
                  </div>
                )}
                {business.email && (
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <Mail size={16} style={{ color: "#6366f1" }} />
                    <span style={{ color: "#94a3b8" }}>{business.email}</span>
                  </div>
                )}
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <Globe size={16} style={{ color: "#6366f1" }} />
                  <span style={{ color: "#94a3b8" }}>bookflow.app/{business.slug}</span>
                </div>
              </div>

              {/* Social Media Links */}
              <div style={{ display: "flex", gap: "12px", marginTop: "20px", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "16px" }}>
                {socialLinks.instagram && (
                  <a href={socialLinks.instagram} target="_blank" rel="noreferrer" style={{ width: "36px", height: "36px", borderRadius: "50%", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8", textDecoration: "none", transition: "all 0.3s" }} className="social-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-instagram"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
                  </a>
                )}
                {socialLinks.facebook && (
                  <a href={socialLinks.facebook} target="_blank" rel="noreferrer" style={{ width: "36px", height: "36px", borderRadius: "50%", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8", textDecoration: "none", transition: "all 0.3s" }} className="social-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-facebook"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
                  </a>
                )}
              </div>
            </section>

          </div>

        </div>

      </div>

      <style jsx global>{`
        @media (max-width: 900px) {
          .business-grid-layout {
            grid-template-columns: 1fr !important;
          }
        }
        .gallery-thumb:hover {
          transform: scale(1.05);
        }
        .social-icon:hover {
          color: #ffffff !important;
          background: #6366f1 !important;
          border-color: #6366f1 !important;
        }
        .service-list-item:hover {
          background: rgba(255,255,255,0.04) !important;
          border-color: rgba(99,102,241,0.2) !important;
        }
      `}</style>
    </div>
  );
}
