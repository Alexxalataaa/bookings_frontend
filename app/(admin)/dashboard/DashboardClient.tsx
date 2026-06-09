"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  getBusinesses,
  getBusinessesAll,
  getMyBusinesses,
  getBusiness,
  createBusiness,
  updateBusiness,
  deleteBusiness,
  getServices,
  createService,
  updateService,
  deleteService,
  getAppointments,
  updateAppointment,
  deleteAppointment,
  getPayments,
  getRewards,
  createReward,
  updateReward,
  deleteReward,
  Business,
  Service,
  Reward,
  Booking,
  Payment
} from "@/lib/api";
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
  Gift,
  RefreshCw,
  LogOut,
  UserCheck,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  FileCode2,
  ChevronRight,
  Settings,
  Building,
  DollarSign,
  Briefcase,
  Eye,
  ArrowLeft
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ChatWidget from "@/components/ChatWidget";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell
} from "recharts";

export default function DashboardClient() {
  const router = useRouter();

  // Auth state
  const [userRole, setUserRole] = useState<"client" | "business" | "superadmin">("business");
  const [viewMode, setViewMode] = useState<"real" | "clientPreview">("real");
  const [userName, setUserName] = useState("Usuario Premium");
  const [loading, setLoading] = useState(true);
  const effectiveRole = viewMode === "clientPreview" ? "client" : userRole;

  // Business Owner States
  const [ownedBusinesses, setOwnedBusinesses] = useState<Business[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [businessBookings, setBusinessBookings] = useState<Booking[]>([]);
  const [businessServices, setBusinessServices] = useState<Service[]>([]);
  const [businessRewards, setBusinessRewards] = useState<Reward[]>([]);
  const [businessPayments, setBusinessPayments] = useState<Payment[]>([]);

  // Client view States
  const [allBusinesses, setAllBusinesses] = useState<Business[]>([]);
  const [clientBookings, setClientBookings] = useState<Booking[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [selectedCity, setSelectedCity] = useState("Todos");

  // Superadmin view States
  const [superadminBusinesses, setSuperadminBusinesses] = useState<Business[]>([]);
  const [superadminBookings, setSuperadminBookings] = useState<Booking[]>([]);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [superadminSearch, setSuperadminSearch] = useState("");
  const [businessBookingSearch, setBusinessBookingSearch] = useState("");
  const [deleteServiceTarget, setDeleteServiceTarget] = useState<number | null>(null);
  const [deleteBusinessTarget, setDeleteBusinessTarget] = useState<{ id: number; name: string } | null>(null);

  const filteredSuperadminBusinesses = useMemo(() => {
    if (!superadminSearch.trim()) return superadminBusinesses;
    const lower = superadminSearch.toLowerCase();
    return superadminBusinesses.filter(b => 
      b.name.toLowerCase().includes(lower) ||
      b.category.toLowerCase().includes(lower) ||
      (b.city && b.city.toLowerCase().includes(lower)) ||
      (b.owner?.fullName && b.owner.fullName.toLowerCase().includes(lower))
    );
  }, [superadminBusinesses, superadminSearch]);

  const filteredBusinessBookings = useMemo(() => {
    if (!businessBookingSearch.trim()) return businessBookings;
    const lower = businessBookingSearch.toLowerCase();
    return businessBookings.filter(b => 
      b.serviceName.toLowerCase().includes(lower) ||
      (b.user?.fullName && b.user.fullName.toLowerCase().includes(lower)) ||
      (b.customerId && b.customerId.toString().includes(lower)) ||
      b.status.toLowerCase().includes(lower) ||
      b.date.includes(lower)
    );
  }, [businessBookings, businessBookingSearch]);

  const [sortBookingsCol, setSortBookingsCol] = useState<string | null>(null);
  const [sortBookingsDir, setSortBookingsDir] = useState<'asc' | 'desc'>('asc');

  const handleSortBookings = (column: string) => {
    if (sortBookingsCol === column) {
      setSortBookingsDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBookingsCol(column);
      setSortBookingsDir('asc');
    }
  };

  const renderSortIndicatorBookings = (column: string) => {
    if (sortBookingsCol !== column) return <span style={{ opacity: 0.3, marginLeft: 4, fontSize: '10px' }}>↕</span>;
    return <span style={{ color: "var(--primary)", marginLeft: 4, fontSize: '12px' }}>{sortBookingsDir === 'asc' ? '↑' : '↓'}</span>;
  };

  const sortedBusinessBookings = useMemo(() => {
    if (!sortBookingsCol) return filteredBusinessBookings;
    return [...filteredBusinessBookings].sort((a, b) => {
      let aVal: any = a[sortBookingsCol as keyof Booking];
      let bVal: any = b[sortBookingsCol as keyof Booking];

      if (sortBookingsCol === 'clientName') {
         aVal = a.user?.fullName || '';
         bVal = b.user?.fullName || '';
      }
      if (sortBookingsCol === 'date') {
         aVal = new Date(`${a.date}T${a.time}`).getTime();
         bVal = new Date(`${b.date}T${b.time}`).getTime();
      }

      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();

      if (aVal < bVal) return sortBookingsDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortBookingsDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredBusinessBookings, sortBookingsCol, sortBookingsDir]);

  const [sortBusinessesCol, setSortBusinessesCol] = useState<string | null>(null);
  const [sortBusinessesDir, setSortBusinessesDir] = useState<'asc' | 'desc'>('asc');

  const handleSortBusinesses = (column: string) => {
    if (sortBusinessesCol === column) {
      setSortBusinessesDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBusinessesCol(column);
      setSortBusinessesDir('asc');
    }
  };

  const renderSortIndicatorBusinesses = (column: string) => {
    if (sortBusinessesCol !== column) return <span style={{ opacity: 0.3, marginLeft: 4, fontSize: '10px' }}>↕</span>;
    return <span style={{ color: "var(--primary)", marginLeft: 4, fontSize: '12px' }}>{sortBusinessesDir === 'asc' ? '↑' : '↓'}</span>;
  };

  const sortedSuperadminBusinesses = useMemo(() => {
    if (!sortBusinessesCol) return filteredSuperadminBusinesses;
    return [...filteredSuperadminBusinesses].sort((a, b) => {
      let aVal: any = a[sortBusinessesCol as keyof Business];
      let bVal: any = b[sortBusinessesCol as keyof Business];

      if (sortBusinessesCol === 'owner') {
         aVal = a.owner?.fullName || '';
         bVal = b.owner?.fullName || '';
      }

      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();

      if (aVal < bVal) return sortBusinessesDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortBusinessesDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredSuperadminBusinesses, sortBusinessesCol, sortBusinessesDir]);

  // Create Business form state
  const [showCreateBiz, setShowCreateBiz] = useState(false);
  const [newBizName, setNewBizName] = useState("");
  const [newBizCategory, setNewBizCategory] = useState("Estética");
  const [newBizCity, setNewBizCity] = useState("Alicante");
  const [newBizStreet, setNewBizStreet] = useState("");
  const [newBizPhone, setNewBizPhone] = useState("");
  const [newBizEmail, setNewBizEmail] = useState("");
  const [newBizDesc, setNewBizDesc] = useState("");

  // Service Management form state
  const [showAddService, setShowAddService] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [serviceName, setServiceName] = useState("");
  const [servicePrice, setServicePrice] = useState("");
  const [serviceDuration, setServiceDuration] = useState("30");
  const [serviceDesc, setServiceDesc] = useState("");

  // Reward Management form state
  const [showAddReward, setShowAddReward] = useState(false);
  const [editingReward, setEditingReward] = useState<Reward | null>(null);
  const [rewardName, setRewardName] = useState("");
  const [rewardDesc, setRewardDesc] = useState("");
  const [rewardPoints, setRewardPoints] = useState("");
  const [rewardValidUntil, setRewardValidUntil] = useState("");

  // Business settings form state
  const [showSettingsTab, setShowSettingsTab] = useState(false);
  const [editBizName, setEditBizName] = useState("");
  const [editBizPhone, setEditBizPhone] = useState("");
  const [editBizEmail, setEditBizEmail] = useState("");
  const [editBizStreet, setEditBizStreet] = useState("");
  const [editBizCity, setEditBizCity] = useState("");
  const [editBizZipCode, setEditBizZipCode] = useState("");
  const [editBizDesc, setEditBizDesc] = useState("");
  const [editBizImage, setEditBizImage] = useState("");
  const [editBizLogo, setEditBizLogo] = useState("");
  const [editBizHours, setEditBizHours] = useState({ monFri: "", sat: "", sun: "" });
  const [settingsSuccess, setSettingsSuccess] = useState(false);

  const handleDemoLogin = (role: "client" | "business" | "superadmin") => {
    localStorage.setItem("user_role", role);
    let name = "Usuario de BookFlow";
    if (role === "client") name = "Cliente Premium";
    else if (role === "business") name = "Propietario de Negocios";
    else if (role === "superadmin") name = "Administrador Principal";

    localStorage.setItem("user_name", name);
    setUserRole(role);
    setUserName(name);
    loadDashboardData(role);
  };

  useEffect(() => {
    // Check local auth details
    const role = localStorage.getItem("user_role") || "business";
    const name = localStorage.getItem("user_name") || "Usuario de BookFlow";
    setUserRole(role as any);
    setUserName(name);

    loadDashboardData(role);
  }, []);

  async function loadDashboardData(role: string) {
    try {
      setLoading(true);
      if (role === "business") {
        // Fetch owned businesses
        const businesses = await getMyBusinesses();
        setOwnedBusinesses(businesses);
        if (businesses.length > 0) {
          await selectBusiness(businesses[0]);
        }
      } else if (role === "client") {
        // Fetch all active businesses for searching and client's own bookings
        const [businesses, myBookings] = await Promise.all([
          getBusinesses(),
          getAppointments().catch(() => [])
        ]);
        setAllBusinesses(businesses);
        setClientBookings(myBookings);
      } else if (role === "superadmin") {
        // Fetch all businesses and all bookings for platform management
        const [businesses, allBookings] = await Promise.all([
          getBusinessesAll(),
          getAppointments().catch(() => [])
        ]);
        setSuperadminBusinesses(businesses);
        setSuperadminBookings(allBookings);

        // Mock audit logs
        setActivityLogs([
          { id: 1, timestamp: "12:44:11", user: "Propietario", action: "Acceso", details: "Inicio sesión del dueño del negocio" },
          { id: 2, timestamp: "12:32:04", user: "Sistema", action: "Base de Datos", details: "Conexión SQLite establecida y sincronizada" },
          { id: 3, timestamp: "11:15:30", user: "admin", action: "Login", details: "Superadmin autenticado exitosamente" }
        ]);
      }
    } catch (err) {
      console.error("Error loading dashboard data:", err);
    } finally {
      setLoading(false);
    }
  }

  // Handle Switch Business
  async function selectBusiness(business: Business) {
    setSelectedBusiness(business);

    // Load setting form fields
    setEditBizName(business.name);
    setEditBizPhone(business.phone || "");
    setEditBizEmail(business.email || "");
    setEditBizStreet(business.street || "");
    setEditBizCity(business.city || "");
    setEditBizZipCode(business.zipCode || "");
    setEditBizDesc(business.description || "");
    setEditBizImage(business.image || "");
    setEditBizLogo(business.logo || "");

    const parsedHours = business.hours ? JSON.parse(business.hours) : { monFri: "09:00 - 18:00", sat: "09:00 - 14:00", sun: "Cerrado" };
    setEditBizHours(parsedHours);

    // Fetch related bookings, services, and payments for this specific business
    try {
      const bookings = await getAppointments(business.id);
      const services = await getServices(business.id);
      const payments = await getPayments(undefined, business.id);
      const rewards = await getRewards(business.id);

      setBusinessBookings(bookings);
      setBusinessServices(services);
      setBusinessPayments(payments);
      setBusinessRewards(rewards);
    } catch (err) {
      console.error("Error loading data for business", business.name, err);
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user_role");
    localStorage.removeItem("user_name");
    window.location.href = "/login";
  };

  const handleEnterClientView = async () => {
    if (viewMode === "clientPreview") return;
    setViewMode("clientPreview");
    if (allBusinesses.length === 0) {
      await loadDashboardData("client");
    }
  };

  const handleReturnToAdminView = async () => {
    setViewMode("real");
    if (userRole === "superadmin" && superadminBusinesses.length === 0) {
      await loadDashboardData("superadmin");
    }
  };

  // Create Business
  const handleCreateBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBizName.trim()) return;

    try {
      setLoading(true);
      const newBiz = await createBusiness({
        name: newBizName,
        category: newBizCategory,
        city: newBizCity,
        street: newBizStreet,
        phone: newBizPhone,
        email: newBizEmail,
        description: newBizDesc,
        image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1000&auto=format&fit=crop&q=80",
        logo: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=200&auto=format&fit=crop&q=80",
        hours: JSON.stringify({ monFri: "09:00 - 18:00", sat: "09:00 - 14:00", sun: "Cerrado" })
      });

      const updatedList = await getMyBusinesses();
      setOwnedBusinesses(updatedList);
      setShowCreateBiz(false);

      // Select the newly created business
      const match = updatedList.find(b => b.id === newBiz.id) || newBiz;
      await selectBusiness(match);

      // Reset form
      setNewBizName("");
      setNewBizStreet("");
      setNewBizPhone("");
      setNewBizEmail("");
      setNewBizDesc("");
    } catch (err) {
      console.error("Error creating business:", err);
    } finally {
      setLoading(false);
    }
  };

  // Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBusiness) return;

    try {
      setSettingsSuccess(false);
      const updated = await updateBusiness(selectedBusiness.id, {
        name: editBizName,
        phone: editBizPhone,
        email: editBizEmail,
        street: editBizStreet,
        city: editBizCity,
        zipCode: editBizZipCode,
        description: editBizDesc,
        image: editBizImage,
        logo: editBizLogo,
        hours: JSON.stringify(editBizHours)
      });

      setSettingsSuccess(true);

      // Reload business switcher list and details
      const list = await getMyBusinesses();
      setOwnedBusinesses(list);

      const refreshed = list.find(b => b.id === selectedBusiness.id) || updated;
      setSelectedBusiness(refreshed);

      setTimeout(() => setSettingsSuccess(false), 3000);
    } catch (err) {
      console.error("Error updating settings:", err);
    }
  };

  // Manage Services (Create / Update / Delete)
  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBusiness) return;

    try {
      if (editingService) {
        // Update
        await updateService(editingService.id, {
          name: serviceName,
          price: Number(servicePrice),
          duration: Number(serviceDuration),
          description: serviceDesc
        });
      } else {
        // Create
        await createService({
          name: serviceName,
          price: Number(servicePrice),
          duration: Number(serviceDuration),
          description: serviceDesc,
          businessId: selectedBusiness.id
        });
      }

      // Reload services list
      const services = await getServices(selectedBusiness.id);
      setBusinessServices(services);

      // Reset service form
      setServiceName("");
      setServicePrice("");
      setServiceDuration("30");
      setServiceDesc("");
      setShowAddService(false);
      setEditingService(null);
    } catch (err) {
      console.error("Error saving service:", err);
    }
  };

  const handleDeleteServiceClick = (id: number) => {
    setDeleteServiceTarget(id);
  };

  const confirmDeleteService = async () => {
    if (deleteServiceTarget === null || !selectedBusiness) return;
    try {
      await deleteService(deleteServiceTarget);
      const services = await getServices(selectedBusiness.id);
      setBusinessServices(services);
    } catch (err) {
      console.error("Error deleting service:", err);
    } finally {
      setDeleteServiceTarget(null);
    }
  };

  const handleEditServiceClick = (service: Service) => {
    setEditingService(service);
    setServiceName(service.name);
    setServicePrice(service.price.toString());
    setServiceDuration(service.duration.toString());
    setServiceDesc(service.description || "");
    setShowAddService(true);
  };

  // Manage Rewards (Create / Update / Delete)
  const handleSaveReward = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBusiness) return;

    try {
      if (editingReward) {
        await updateReward(editingReward.id, {
          name: rewardName,
          description: rewardDesc,
          pointsRequired: rewardPoints ? Number(rewardPoints) : undefined,
          validUntil: rewardValidUntil || undefined,
        });
      } else {
        await createReward({
          name: rewardName,
          description: rewardDesc,
          pointsRequired: rewardPoints ? Number(rewardPoints) : undefined,
          validUntil: rewardValidUntil || undefined,
          isActive: true,
          businessId: selectedBusiness.id
        });
      }

      // Reload rewards list
      const rewards = await getRewards(selectedBusiness.id);
      setBusinessRewards(rewards);

      // Reset reward form
      setRewardName("");
      setRewardDesc("");
      setRewardPoints("");
      setRewardValidUntil("");
      setShowAddReward(false);
      setEditingReward(null);
    } catch (err) {
      console.error("Error saving reward:", err);
    }
  };

  const [deleteRewardTarget, setDeleteRewardTarget] = useState<number | null>(null);

  const confirmDeleteReward = async () => {
    if (deleteRewardTarget === null || !selectedBusiness) return;
    try {
      await deleteReward(deleteRewardTarget);
      const rewards = await getRewards(selectedBusiness.id);
      setBusinessRewards(rewards);
    } catch (err) {
      console.error("Error deleting reward:", err);
    } finally {
      setDeleteRewardTarget(null);
    }
  };

  const handleEditRewardClick = (reward: Reward) => {
    setEditingReward(reward);
    setRewardName(reward.name);
    setRewardDesc(reward.description || "");
    setRewardPoints(reward.pointsRequired ? reward.pointsRequired.toString() : "");
    setRewardValidUntil(reward.validUntil || "");
    setShowAddReward(true);
  };

  // Booking Actions (Confirm / Cancel)
  const handleConfirmBooking = async (bookingId: number) => {
    if (!selectedBusiness) return;
    try {
      await updateAppointment(bookingId, { status: "confirmed" });
      const bookings = await getAppointments(selectedBusiness.id);
      setBusinessBookings(bookings);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCancelBooking = async (bookingId: number) => {
    if (!selectedBusiness) return;
    try {
      await updateAppointment(bookingId, { status: "cancelled" });
      const bookings = await getAppointments(selectedBusiness.id);
      setBusinessBookings(bookings);
    } catch (err) {
      console.error(err);
    }
  };

  // Superadmin Actions
  const handleToggleSuspendBusiness = async (businessId: number) => {
    const target = superadminBusinesses.find(b => b.id === businessId);
    if (!target) return;
    try {
      await updateBusiness(businessId, { isSuspended: !target.isSuspended });
      const list = await getBusinessesAll();
      setSuperadminBusinesses(list);

      // Update local logs
      const act = target.isSuspended ? "Reactivar Negocio" : "Suspender Negocio";
      setActivityLogs(prev => [
        { id: Date.now(), timestamp: new Date().toTimeString().split(" ")[0], user: "admin", action: act, details: `${act}: ${target.name}` },
        ...prev
      ]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteBusinessSuperClick = (businessId: number, name: string) => {
    setDeleteBusinessTarget({ id: businessId, name });
  };

  const confirmDeleteBusinessSuper = async () => {
    if (!deleteBusinessTarget) return;
    try {
      await deleteBusiness(deleteBusinessTarget.id);
      const list = await getBusinessesAll();
      setSuperadminBusinesses(list);

      setActivityLogs(prev => [
        { id: Date.now(), timestamp: new Date().toTimeString().split(" ")[0], user: "admin", action: "Eliminar Negocio", details: `Eliminó permanentemente: ${deleteBusinessTarget.name}` },
        ...prev
      ]);
    } catch (err) {
      console.error(err);
    } finally {
      setDeleteBusinessTarget(null);
    }
  };

  // Calculate Metrics for selected business
  const getRevenue = () => {
    return businessPayments
      .filter(p => p.status === "paid")
      .reduce((sum, p) => sum + Number(p.amount), 0);
  };

  const getCancelRate = () => {
    if (businessBookings.length === 0) return 0;
    const cancelled = businessBookings.filter(b => b.status === "cancelled").length;
    return ((cancelled / businessBookings.length) * 100).toFixed(1);
  };

  const getClientCount = () => {
    const uniqueClients = new Set(businessBookings.map(b => b.user?.fullName || b.customerId.toString()));
    return uniqueClients.size;
  };

  // Format Recharts data
  const getRevenueChartData = () => {
    const dates: { [key: string]: number } = {};
    businessPayments.forEach(p => {
      dates[p.date] = (dates[p.date] || 0) + Number(p.amount);
    });
    return Object.keys(dates).sort().map(d => ({ fecha: d, total: dates[d] }));
  };

  const getServicesChartData = () => {
    const counts: { [key: string]: number } = {};
    businessBookings.forEach(b => {
      counts[b.serviceName] = (counts[b.serviceName] || 0) + 1;
    });
    return Object.keys(counts).map(name => ({ name, value: counts[name] }));
  };

  if (loading && !selectedBusiness && ownedBusinesses.length === 0) {
    return (
      <div style={{ padding: "80px", textAlign: "center", color: "var(--text-muted)", minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", background: "var(--bg)" }}>
        <Activity className="spinner" size={40} style={{ margin: "0 auto 16px", color: "var(--primary)" }} />
        <p>Cargando panel de BookFlow...</p>
      </div>
    );
  }

  const MAPA_CATEGORIAS: any = {
    "Estética": { stringBD: "Belleza" },
    "Bienestar": { stringBD: "Nutrición" },
    "Salud": { stringBD: "Psicología" },
    "Deporte": { stringBD: "Deporte" }
  };

  const filteredBusinesses = allBusinesses.filter(b => {
    const matchesSearch = b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.city?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      b.category.toLowerCase().includes(searchQuery.toLowerCase());
      
    const terminoBusquedaBD = MAPA_CATEGORIAS[selectedCategory]?.stringBD || selectedCategory;
    const matchesCategory = selectedCategory === "Todos" || b.category === terminoBusquedaBD;
    const matchesCity = selectedCity === "Todos" || b.city === selectedCity;
    return matchesSearch && matchesCategory && matchesCity;
  });

  return (
    <div className="page-stack">
      <style>{`
        .kpi-card {
          transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) !important;
          position: relative;
          overflow: hidden;
        }
        .kpi-card::before {
          content: ''; position: absolute; top: 0; left: -100%; width: 50%; height: 100%;
          background: linear-gradient(to right, transparent, rgba(255,255,255,0.03), transparent);
          transform: skewX(-20deg); transition: all 0.7s ease;
        }
        .kpi-card:hover::before {
          left: 200%;
        }
        .kpi-card:hover {
          transform: translateY(-8px) scale(1.02) !important;
          box-shadow: 0 20px 40px -10px rgba(99, 102, 241, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1) !important;
          border-color: rgba(99, 102, 241, 0.5) !important;
          z-index: 10;
        }
        .kpi-card__value {
          background: linear-gradient(135deg, #ffffff 0%, #a5b4fc 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          filter: drop-shadow(0 2px 10px rgba(99,102,241,0.2));
        }
        .section-card {
          transition: border-color 0.4s ease, box-shadow 0.4s ease !important;
        }
        .section-card:hover {
          border-color: rgba(99, 102, 241, 0.3) !important;
          box-shadow: 0 10px 40px -10px rgba(0,0,0,0.5) !important;
        }
        .recharts-pie-sector {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
          cursor: pointer;
          filter: drop-shadow(0 4px 8px rgba(0,0,0,0.5));
        }
        .recharts-pie-sector:hover {
          filter: drop-shadow(0 0 20px rgba(99, 102, 241, 0.8)) brightness(1.2) !important;
        }
        .recharts-area-area {
          filter: drop-shadow(0 15px 25px rgba(99, 102, 241, 0.3));
        }
      `}</style>

      {/* -------------------- 1. CLIENT VIEWS -------------------- */}
      {effectiveRole === "client" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="page-stack">
          <ChatWidget />
          <section className="page-hero" style={{ background: "linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(168, 85, 247, 0.04) 100%)", border: "1px solid rgba(99, 102, 241, 0.2)" }}>
            <div style={{ maxWidth: "600px" }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(99, 102, 241, 0.15)", padding: "6px 12px", borderRadius: "20px", fontSize: "12px", color: "var(--primary)", fontWeight: "bold", marginBottom: "16px" }}>
                <Sparkles size={14} /> Tu agenda de bienestar en un solo click
              </div>
              <h2 style={{ fontSize: "40px", fontWeight: "900", letterSpacing: "-0.04em", lineHeight: "1.1" }}>
                Reserva Citas Profesionales al Instante
              </h2>
              <p style={{ color: "var(--text-muted)", fontSize: "16px", marginTop: "12px" }}>
                Agenda de forma dinámica, visualiza disponibilidad en tiempo real y gestiona tus reservas desde tu panel prémium.
              </p>

              {userRole === "superadmin" && viewMode === "clientPreview" && (
                <div style={{ marginTop: "24px", padding: "16px", borderRadius: "16px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(99, 102, 241, 0.12)", display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center" }}>
                  <span style={{ color: "var(--primary)", fontWeight: 700 }}>Modo Vista Cliente</span>
                  <span style={{ color: "var(--text-muted)", flex: 1, minWidth: "220px" }}>Estás viendo la aplicación como cliente, preservando tu acceso como superadmin.</span>
                  <button
                    className="secondary-btn"
                    onClick={handleReturnToAdminView}
                    style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "10px 16px" }}
                  >
                    <ArrowLeft size={16} />
                    Volver a vista admin
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* Client KPI Totals */}
          <section className="kpi-grid">
            <div className="kpi-card">
              <p className="kpi-card__label">Mis Reservas</p>
              <h3 className="kpi-card__value">{clientBookings.length}</h3>
              <p className="kpi-card__meta kpi-card__meta--positive">
                <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                  <TrendingUp size={14} /> Total histórico
                </span>
              </p>
            </div>
            <div className="kpi-card">
              <p className="kpi-card__label">Confirmadas</p>
              <h3 className="kpi-card__value" style={{ color: "var(--success)" }}>
                {clientBookings.filter(b => b.status === "confirmed" || b.status === "paid").length}
              </h3>
              <p className="kpi-card__meta kpi-card__meta--positive">
                <span>Activas y pagadas</span>
              </p>
            </div>
            <div className="kpi-card">
              <p className="kpi-card__label">Canceladas</p>
              <h3 className="kpi-card__value" style={{ color: clientBookings.filter(b => b.status === "cancelled").length > 0 ? "var(--accent)" : "var(--success)" }}>
                {clientBookings.filter(b => b.status === "cancelled").length}
              </h3>
              <p className="kpi-card__meta" style={{ color: "var(--text-muted)" }}>
                <span>Historial de bajas</span>
              </p>
            </div>
            <div className="kpi-card">
              <p className="kpi-card__label">Negocios Visitados</p>
              <h3 className="kpi-card__value">
                {new Set(clientBookings.map(b => b.businessId)).size}
              </h3>
              <p className="kpi-card__meta kpi-card__meta--positive">
                <span>Locales únicos</span>
              </p>
            </div>
          </section>

          {/* Search bar & Filters */}
          <section className="section-card" style={{ background: "rgba(255, 255, 255, 0.01)", border: "1px solid var(--border)" }}>
            <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "center" }}>
              <div style={{ position: "relative", flex: 1, minWidth: "260px" }}>
                <Search size={18} style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input"
                  placeholder="Buscar peluquería, masajes, estética, barbería..."
                  style={{ paddingLeft: "48px" }}
                />
              </div>

              <div style={{ width: "160px" }}>
                <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="select">
                  <option value="Todos">Categoría: Todas</option>
                  <option value="Estética">Estética</option>
                  <option value="Salud">Salud</option>
                  <option value="Bienestar">Bienestar</option>
                </select>
              </div>

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
            <h3 style={{ fontSize: "20px", fontWeight: "700", marginBottom: "20px" }}>Negocios Disponibles ({filteredBusinesses.length})</h3>

            <div className="customer-grid">
              {filteredBusinesses.map((b) => (
                <div key={b.id} className="customer-card" style={{ display: "flex", flexDirection: "column", height: "100%", gap: "16px", overflow: "hidden", padding: "0", background: "var(--surface)" }}>

                  <div style={{ position: "relative", height: "180px", width: "100%" }}>
                    {b.image ? (
                      <img src={b.image} alt={b.name} style={{ width: "100%", height: "180px", objectFit: "cover" }} />
                    ) : (
                      <div style={{ width: "100%", height: "180px", background: "#e5e7eb", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ color: "#9ca3af" }}>{b.name}</span>
                      </div>

                    )}
                    <span style={{ position: "absolute", top: "12px", right: "12px", background: "rgba(11, 13, 17, 0.8)", backdropFilter: "blur(4px)", padding: "4px 8px", borderRadius: "6px", fontSize: "12px", fontWeight: "bold", display: "flex", alignItems: "center", gap: "4px", color: "var(--warning)" }}>
                      <Star size={14} fill="currentColor" /> {b.rating}
                    </span>
                    <span style={{ position: "absolute", bottom: "12px", left: "12px", background: "var(--primary-gradient)", padding: "4px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: "bold" }}>
                      {b.category}
                    </span>
                  </div>

                  <div style={{ padding: "0 24px 24px", display: "flex", flexDirection: "column", flex: 1, gap: "12px" }}>
                    <div>
                      <h4 style={{ fontSize: "18px", fontWeight: "bold", margin: "0" }}>{b.name}</h4>
                      <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "4px" }}>
                        <MapPin size={12} /> {b.street}, {b.city}
                      </p>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border)", paddingTop: "12px", marginTop: "auto" }}>
                      <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                        Saber más y horarios
                      </span>

                      {/* CRITICAL CHANGE: User opens a dedicated landing page instead of a small card modal */}
                      <button
                        className="primary-btn"
                        onClick={() => router.push(`/business/${b.id}`)}
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

        </motion.div>
      )}

      {/* -------------------- 2. BUSINESS VIEWS (OWNER DASHBOARD) -------------------- */}
      {effectiveRole === "business" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="page-stack">

          {/* Header Switcher & Create Business Button */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>

            {/* Active Business Switcher */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ background: "rgba(99,102,241,0.1)", color: "var(--primary)", padding: "10px", borderRadius: "12px" }}>
                <Building size={24} />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "1px", fontWeight: "bold" }}>Mi Negocio Activo</p>
                {ownedBusinesses.length > 0 ? (
                  <select
                    value={selectedBusiness?.id || ""}
                    onChange={(e) => {
                      const biz = ownedBusinesses.find(b => b.id === Number(e.target.value));
                      if (biz) selectBusiness(biz);
                    }}
                    className="select text-slate-900 dark:text-white"
                    style={{ fontSize: "18px", fontWeight: "bold", background: "none", border: "none", padding: 0, cursor: "pointer", width: "auto", minWidth: "200px" }}
                  >
                    {ownedBusinesses.map(b => (
                      <option key={b.id} value={b.id} style={{ color: "#000000" }}>{b.name}</option>
                    ))}
                  </select>
                ) : (
                  <p style={{ margin: 0, fontSize: "15px", fontWeight: "bold" }}>Ningún negocio registrado</p>
                )}
              </div>
            </div>

            {/* Dashboard Tabs / Create business */}
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              {selectedBusiness && (
                <button
                  className="secondary-btn"
                  onClick={() => setShowSettingsTab(!showSettingsTab)}
                  style={{ display: "flex", gap: "8px", alignItems: "center", borderColor: showSettingsTab ? "var(--primary)" : "var(--border)" }}
                >
                  <Settings size={16} />
                  <span>{showSettingsTab ? "Ver Tablero" : "Configuración Negocio"}</span>
                </button>
              )}

              <button
                className="primary-btn"
                onClick={() => setShowCreateBiz(true)}
                style={{ display: "flex", gap: "8px", alignItems: "center" }}
              >
                <Plus size={16} />
                <span>Registrar Negocio</span>
              </button>
            </div>

          </div>

          {/* CREATE BUSINESS FORM MODAL */}
          <AnimatePresence>
            {showCreateBiz && (
              <div className="modal-backdrop">
                <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="modal-card" style={{ maxWidth: "560px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                    <h3 style={{ fontSize: "20px", fontWeight: "bold", margin: 0 }}>Registrar Nuevo Negocio</h3>
                    <button className="mobile-toggle" onClick={() => setShowCreateBiz(false)}>✕</button>
                  </div>

                  <form onSubmit={handleCreateBusiness} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                    <div>
                      <label className="kpi-card__label" style={{ marginBottom: "6px", display: "block" }}>Nombre Comercial</label>
                      <input type="text" required value={newBizName} onChange={(e) => setNewBizName(e.target.value)} className="input" placeholder="Ej. Studio A" />
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                      <div>
                        <label className="kpi-card__label" style={{ marginBottom: "6px", display: "block" }}>Categoría</label>
                        <select value={newBizCategory} onChange={(e) => setNewBizCategory(e.target.value)} className="select">
                          <option value="Estética">Estética</option>
                          <option value="Salud">Salud</option>
                          <option value="Bienestar">Bienestar</option>
                        </select>
                      </div>
                      <div>
                        <label className="kpi-card__label" style={{ marginBottom: "6px", display: "block" }}>Ciudad</label>
                        <select value={newBizCity} onChange={(e) => setNewBizCity(e.target.value)} className="select">
                          <option value="Alicante">Alicante</option>
                          <option value="Elche">Elche</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="kpi-card__label" style={{ marginBottom: "6px", display: "block" }}>Dirección</label>
                      <input type="text" value={newBizStreet} onChange={(e) => setNewBizStreet(e.target.value)} className="input" placeholder="Calle y número" />
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                      <div>
                        <label className="kpi-card__label" style={{ marginBottom: "6px", display: "block" }}>Teléfono</label>
                        <input type="tel" value={newBizPhone} onChange={(e) => setNewBizPhone(e.target.value)} className="input" placeholder="965123456" />
                      </div>
                      <div>
                        <label className="kpi-card__label" style={{ marginBottom: "6px", display: "block" }}>Email</label>
                        <input type="email" value={newBizEmail} onChange={(e) => setNewBizEmail(e.target.value)} className="input" placeholder="correo@negocio.com" />
                      </div>
                    </div>

                    <div>
                      <label className="kpi-card__label" style={{ marginBottom: "6px", display: "block" }}>Descripción Corta</label>
                      <textarea value={newBizDesc} onChange={(e) => setNewBizDesc(e.target.value)} className="input" style={{ height: "60px", resize: "none" }} placeholder="Breve reseña sobre lo que ofreces..." />
                    </div>

                    <button type="submit" className="primary-btn" style={{ width: "100%", justifyContent: "center", marginTop: "10px" }}>
                      <span>Crear Negocio</span>
                    </button>
                  </form>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* MAIN BUSINESS OWNER DISPLAY */}
          {selectedBusiness ? (
            <div>
              {showSettingsTab ? (
                /* BUSINESS SETTINGS TAB */
                <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="section-card">
                  <h3 style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "20px" }}>Ajustes y Perfil de {selectedBusiness.name}</h3>

                  <form onSubmit={handleSaveSettings} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }} className="responsive-profile-grid">
                      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        <div>
                          <label className="kpi-card__label" style={{ marginBottom: "4px", display: "block" }}>Nombre Comercial</label>
                          <input type="text" required value={editBizName} onChange={(e) => setEditBizName(e.target.value)} className="input" />
                        </div>
                        <div>
                          <label className="kpi-card__label" style={{ marginBottom: "4px", display: "block" }}>Teléfono Contacto</label>
                          <input type="tel" value={editBizPhone} onChange={(e) => setEditBizPhone(e.target.value)} className="input" />
                        </div>
                        <div>
                          <label className="kpi-card__label" style={{ marginBottom: "4px", display: "block" }}>Email Contacto</label>
                          <input type="email" value={editBizEmail} onChange={(e) => setEditBizEmail(e.target.value)} className="input" />
                        </div>
                        <div>
                          <label className="kpi-card__label" style={{ marginBottom: "4px", display: "block" }}>Descripción de Negocio</label>
                          <textarea value={editBizDesc} onChange={(e) => setEditBizDesc(e.target.value)} className="input" style={{ height: "100px", resize: "none" }} />
                        </div>
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        <div>
                          <label className="kpi-card__label" style={{ marginBottom: "4px", display: "block" }}>Calle y Número</label>
                          <input type="text" value={editBizStreet} onChange={(e) => setEditBizStreet(e.target.value)} className="input" />
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "8px" }}>
                          <div>
                            <label className="kpi-card__label" style={{ marginBottom: "4px", display: "block" }}>Ciudad</label>
                            <input type="text" value={editBizCity} onChange={(e) => setEditBizCity(e.target.value)} className="input" />
                          </div>
                          <div>
                            <label className="kpi-card__label" style={{ marginBottom: "4px", display: "block" }}>C.P.</label>
                            <input type="text" value={editBizZipCode} onChange={(e) => setEditBizZipCode(e.target.value)} className="input" />
                          </div>
                        </div>

                        <div>
                          <label className="kpi-card__label" style={{ marginBottom: "4px", display: "block" }}>URL Banner Portada</label>
                          <input type="text" value={editBizImage} onChange={(e) => setEditBizImage(e.target.value)} className="input" />
                        </div>
                        <div>
                          <label className="kpi-card__label" style={{ marginBottom: "4px", display: "block" }}>URL Logo Perfil</label>
                          <input type="text" value={editBizLogo} onChange={(e) => setEditBizLogo(e.target.value)} className="input" />
                        </div>
                      </div>
                    </div>

                    {/* Opening Hours Panel */}
                    <div style={{ borderTop: "1px solid var(--border)", paddingTop: "20px" }}>
                      <h4 style={{ fontSize: "16px", fontWeight: "bold", marginBottom: "12px" }}>Horarios de Apertura</h4>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px" }}>
                        <div>
                          <label className="kpi-card__label" style={{ marginBottom: "4px", display: "block" }}>Lunes a Viernes</label>
                          <input type="text" value={editBizHours.monFri} onChange={(e) => setEditBizHours({ ...editBizHours, monFri: e.target.value })} className="input" placeholder="09:00 - 20:00" />
                        </div>
                        <div>
                          <label className="kpi-card__label" style={{ marginBottom: "4px", display: "block" }}>Sábados</label>
                          <input type="text" value={editBizHours.sat} onChange={(e) => setEditBizHours({ ...editBizHours, sat: e.target.value })} className="input" placeholder="09:00 - 14:00" />
                        </div>
                        <div>
                          <label className="kpi-card__label" style={{ marginBottom: "4px", display: "block" }}>Domingos</label>
                          <input type="text" value={editBizHours.sun} onChange={(e) => setEditBizHours({ ...editBizHours, sun: e.target.value })} className="input" placeholder="Cerrado" />
                        </div>
                      </div>
                    </div>

                    {/* Feedback Messages */}
                    {settingsSuccess && (
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--success)", fontSize: "13px", padding: "10px", background: "rgba(16, 185, 129, 0.1)", borderRadius: "8px", border: "1px solid rgba(16, 185, 129, 0.2)" }}>
                        <CheckCircle size={16} />
                        <span>Ajustes actualizados correctamente en la base de datos.</span>
                      </div>
                    )}

                    <button type="submit" className="primary-btn" style={{ alignSelf: "flex-end", minWidth: "160px", justifyContent: "center" }}>
                      <span>Guardar Ajustes</span>
                    </button>
                  </form>
                </motion.section>
              ) : (
                /* DASHBOARD STATS TAB */
                <div className="page-stack">

                  {/* Dynamic KPIs per business */}
                  <section className="kpi-grid">
                    <div className="kpi-card">
                      <p className="kpi-card__label">Reservas Registradas</p>
                      <h3 className="kpi-card__value">{businessBookings.length}</h3>
                      <p className="kpi-card__meta kpi-card__meta--positive">
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                          <TrendingUp size={14} /> Total histórico
                        </span>
                      </p>
                    </div>
                    <div className="kpi-card">
                      <p className="kpi-card__label">Facturación Total</p>
                      <h3 className="kpi-card__value">{new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(getRevenue())}</h3>
                      <p className="kpi-card__meta kpi-card__meta--positive">
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                          <DollarSign size={14} /> Cobrado
                        </span>
                      </p>
                    </div>
                    <div className="kpi-card">
                      <p className="kpi-card__label">Tasa de Cancelación</p>
                      <h3 className="kpi-card__value" style={{ color: Number(getCancelRate()) > 10 ? "var(--accent)" : "var(--success)" }}>
                        {getCancelRate()}%
                      </h3>
                      <p className="kpi-card__meta" style={{ color: "var(--text-muted)" }}>
                        <span>Sobre reservas totales</span>
                      </p>
                    </div>
                    <div className="kpi-card">
                      <p className="kpi-card__label">Clientes Únicos</p>
                      <h3 className="kpi-card__value">{getClientCount()}</h3>
                      <p className="kpi-card__meta kpi-card__meta--positive">
                        <span>Base de datos activa</span>
                      </p>
                    </div>
                  </section>

                  {/* Analytics Charts */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "24px" }}>

                    {/* Revenue Line Chart */}
                    <div className="section-card" style={{ height: "400px", padding: "24px" }}>
                      <h4 style={{ fontSize: "16px", fontWeight: "bold", marginBottom: "24px", display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--primary)" }}></span>
                        Histórico de Ingresos
                      </h4>
                      <ResponsiveContainer width="100%" height="85%">
                        <AreaChart data={getRevenueChartData()} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.6} />
                              <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.05} vertical={false} />
                          <XAxis dataKey="fecha" stroke="var(--text-muted)" fontSize={11} axisLine={false} tickLine={false} dy={10} />
                          <YAxis tickFormatter={(val) => `${val}€`} stroke="var(--text-muted)" fontSize={11} axisLine={false} tickLine={false} />
                          <RechartsTooltip 
                            contentStyle={{ 
                              background: "rgba(15, 17, 22, 0.85)", 
                              backdropFilter: "blur(12px)", 
                              border: "1px solid rgba(255,255,255,0.05)", 
                              borderRadius: "12px", 
                              boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
                              color: "#fff"
                            }}
                            itemStyle={{ color: "var(--primary)", fontWeight: "bold" }}
                            cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1, strokeDasharray: "3 3" }}
                            formatter={(value: any) => [`${value}€`, "Ingresos"]}
                            labelStyle={{ color: "var(--text-muted)", marginBottom: "4px" }}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="total" 
                            stroke="var(--primary)" 
                            strokeWidth={4} 
                            fillOpacity={1} 
                            fill="url(#colorTotal)"
                            animationDuration={1500}
                            animationEasing="ease-out"
                            activeDot={{ r: 6, strokeWidth: 0, fill: "#fff", style: { filter: "drop-shadow(0 0 12px rgba(99,102,241,1))" } }}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Services Pie Chart */}
                    <div className="section-card" style={{ height: "400px", padding: "24px" }}>
                      <h4 style={{ fontSize: "16px", fontWeight: "bold", marginBottom: "24px", display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--accent)" }}></span>
                        Distribución por Servicio
                      </h4>
                      <ResponsiveContainer width="100%" height="85%">
                        <PieChart>
                          <RechartsTooltip 
                            contentStyle={{ 
                              background: "rgba(15, 17, 22, 0.85)", 
                              backdropFilter: "blur(12px)", 
                              border: "1px solid rgba(255,255,255,0.05)", 
                              borderRadius: "12px", 
                              boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
                              color: "#fff"
                            }}
                            itemStyle={{ fontWeight: "bold" }}
                            formatter={(value: any, name: any) => [`${value} reservas`, String(name)]}
                          />
                          <text x="50%" y="46%" textAnchor="middle" dominantBaseline="middle" fill="var(--text)" style={{ fontSize: "38px", fontWeight: "900" }}>
                            {getServicesChartData().reduce((acc, curr) => acc + curr.value, 0)}
                          </text>
                          <text x="50%" y="56%" textAnchor="middle" dominantBaseline="middle" fill="var(--text-muted)" style={{ fontSize: "11px", fontWeight: "bold", letterSpacing: "1.5px", textTransform: "uppercase" }}>
                            Reservas
                          </text>
                          <Pie
                            data={getServicesChartData()}
                            innerRadius={80}
                            outerRadius={115}
                            paddingAngle={8}
                            dataKey="value"
                            stroke="none"
                            cornerRadius={8}
                            animationDuration={1500}
                            animationEasing="ease-out"
                          >
                            {getServicesChartData().map((entry, index) => {
                              const colors = ["#6366f1", "#a855f7", "#ec4899", "#14b8a6", "#f59e0b", "#3b82f6"];
                              return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                            })}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                  </div>

                  {/* Services Management */}
                  <section className="section-card">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                      <h3 style={{ fontSize: "18px", fontWeight: "bold", margin: 0 }}>Gestión de Catálogo de Servicios</h3>
                      <button className="primary-btn" onClick={() => {
                        setEditingService(null);
                        setServiceName("");
                        setServicePrice("");
                        setServiceDuration("30");
                        setServiceDesc("");
                        setShowAddService(true);
                      }} style={{ padding: "8px 16px", fontSize: "12px" }}>
                        <Plus size={14} /> Añadir Servicio
                      </button>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
                      {businessServices.map(s => (
                        <div key={s.id} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)", borderRadius: "12px", padding: "16px", display: "flex", flexDirection: "column", gap: "8px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                            <h4 style={{ fontSize: "15px", fontWeight: "bold", margin: 0 }}>{s.name}</h4>
                            <span style={{ fontSize: "16px", fontWeight: "bold", color: "var(--primary)" }}>{s.price} €</span>
                          </div>
                          <p style={{ margin: 0, fontSize: "12px", color: "var(--text-muted)", flex: 1 }}>{s.description || "Sin descripción."}</p>
                          <span style={{ fontSize: "12px", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "4px" }}>
                            <Clock size={12} /> {s.duration} mins
                          </span>
                          <div style={{ display: "flex", gap: "8px", borderTop: "1px solid var(--border)", paddingTop: "8px", marginTop: "8px" }}>
                            <button onClick={() => handleEditServiceClick(s)} className="secondary-btn" style={{ padding: "6px 12px", fontSize: "11px", flex: 1, justifyContent: "center" }}>Editar</button>
                            <button onClick={() => handleDeleteServiceClick(s.id)} className="danger-btn" style={{ padding: "6px 12px", fontSize: "11px", flex: 1, justifyContent: "center" }}>Eliminar</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Rewards Management */}
                  <section className="section-card" style={{ marginTop: "24px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                      <h3 style={{ fontSize: "18px", fontWeight: "bold", margin: 0 }}>Gestión de Premios y Recompensas</h3>
                      <button className="primary-btn" onClick={() => {
                        setEditingReward(null);
                        setRewardName("");
                        setRewardDesc("");
                        setRewardPoints("");
                        setRewardValidUntil("");
                        setShowAddReward(true);
                      }} style={{ padding: "8px 16px", fontSize: "12px", background: "linear-gradient(135deg, #f59e0b, #d97706)", border: "none" }}>
                        <Gift size={14} /> Añadir Premio
                      </button>
                    </div>

                    {businessRewards.length === 0 ? (
                      <p style={{ color: "var(--text-muted)", fontSize: "14px", textAlign: "center", padding: "20px" }}>No has registrado ningún premio aún. ¡Incentiva a tus clientes creando uno!</p>
                    ) : (
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
                        {businessRewards.map(r => (
                          <div key={r.id} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(245, 158, 11, 0.2)", borderRadius: "12px", padding: "16px", display: "flex", flexDirection: "column", gap: "8px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                              <h4 style={{ fontSize: "15px", fontWeight: "bold", margin: 0, color: "#f59e0b" }}>{r.name}</h4>
                            </div>
                            <p style={{ margin: 0, fontSize: "13px", color: "var(--text-muted)", flex: 1 }}>{r.description || "Sin condiciones específicas."}</p>
                            
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "4px" }}>
                              {r.pointsRequired ? (
                                <span style={{ background: "rgba(245, 158, 11, 0.1)", color: "#f59e0b", padding: "4px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: "bold" }}>
                                  Req: {r.pointsRequired} pts
                                </span>
                              ) : null}
                              {r.validUntil ? (
                                <span style={{ background: "rgba(99, 102, 241, 0.1)", color: "var(--primary)", padding: "4px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: "bold" }}>
                                  Válido hasta: {r.validUntil}
                                </span>
                              ) : null}
                            </div>

                            <div style={{ display: "flex", gap: "8px", borderTop: "1px solid var(--border)", paddingTop: "8px", marginTop: "8px" }}>
                              <button onClick={() => handleEditRewardClick(r)} className="secondary-btn" style={{ padding: "6px 12px", fontSize: "11px", flex: 1, justifyContent: "center" }}>Editar</button>
                              <button onClick={() => setDeleteRewardTarget(r.id)} className="danger-btn" style={{ padding: "6px 12px", fontSize: "11px", flex: 1, justifyContent: "center" }}>Eliminar</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>

                  {/* ADD/EDIT REWARD MODAL */}
                  <AnimatePresence>
                    {showAddReward && (
                      <div className="modal-backdrop">
                        <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="modal-card" style={{ maxWidth: "420px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                            <h3 style={{ fontSize: "18px", fontWeight: "bold", margin: 0 }}>
                              {editingReward ? "Editar Premio" : "Añadir Nuevo Premio"}
                            </h3>
                            <button className="mobile-toggle" onClick={() => setShowAddReward(false)}>✕</button>
                          </div>

                          <form onSubmit={handleSaveReward} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                            <div>
                              <label className="kpi-card__label" style={{ marginBottom: "4px", display: "block" }}>Nombre del Premio</label>
                              <input type="text" required value={rewardName} onChange={(e) => setRewardName(e.target.value)} className="input" placeholder="Ej. Corte de pelo gratis" />
                            </div>

                            <div>
                              <label className="kpi-card__label" style={{ marginBottom: "4px", display: "block" }}>Condiciones / Descripción</label>
                              <textarea value={rewardDesc} required onChange={(e) => setRewardDesc(e.target.value)} className="input" style={{ height: "60px", resize: "none" }} placeholder="Ej. Válido tras 10 visitas de lunes a jueves." />
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                              <div>
                                <label className="kpi-card__label" style={{ marginBottom: "4px", display: "block" }}>Puntos requeridos (Opcional)</label>
                                <input type="number" min="0" value={rewardPoints} onChange={(e) => setRewardPoints(e.target.value)} className="input" placeholder="Ej. 10" />
                              </div>
                              <div>
                                <label className="kpi-card__label" style={{ marginBottom: "4px", display: "block" }}>Fecha de Validez (Opcional)</label>
                                <input type="date" value={rewardValidUntil} onChange={(e) => setRewardValidUntil(e.target.value)} className="input" />
                              </div>
                            </div>

                            <button type="submit" className="primary-btn" style={{ width: "100%", justifyContent: "center", marginTop: "10px", background: "linear-gradient(135deg, #f59e0b, #d97706)", border: "none" }}>
                              <span>{editingReward ? "Guardar Cambios" : "Crear Premio"}</span>
                            </button>
                          </form>
                        </motion.div>
                      </div>
                    )}
                  </AnimatePresence>

                  {/* DELETE REWARD CONFIRMATION MODAL */}
                  <AnimatePresence>
                    {deleteRewardTarget !== null && (
                      <div className="modal-backdrop">
                        <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="modal-card" style={{ maxWidth: "400px", textAlign: "center" }}>
                          <AlertCircle size={48} color="#f43f5e" style={{ margin: "0 auto 16px" }} />
                          <h3 style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "8px" }}>¿Eliminar Premio?</h3>
                          <p style={{ color: "var(--text-muted)", marginBottom: "24px" }}>Esta acción no se puede deshacer. Los clientes ya no verán este premio disponible.</p>
                          <div style={{ display: "flex", gap: "12px" }}>
                            <button onClick={() => setDeleteRewardTarget(null)} className="secondary-btn" style={{ flex: 1, justifyContent: "center" }}>Cancelar</button>
                            <button onClick={confirmDeleteReward} className="danger-btn" style={{ flex: 1, justifyContent: "center" }}>Sí, eliminar</button>
                          </div>
                        </motion.div>
                      </div>
                    )}
                  </AnimatePresence>

                  {/* ADD/EDIT SERVICE MODAL */}
                  <AnimatePresence>
                    {showAddService && (
                      <div className="modal-backdrop">
                        <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="modal-card" style={{ maxWidth: "420px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                            <h3 style={{ fontSize: "18px", fontWeight: "bold", margin: 0 }}>
                              {editingService ? "Editar Servicio" : "Añadir Nuevo Servicio"}
                            </h3>
                            <button className="mobile-toggle" onClick={() => setShowAddService(false)}>✕</button>
                          </div>

                          <form onSubmit={handleSaveService} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                            <div>
                              <label className="kpi-card__label" style={{ marginBottom: "4px", display: "block" }}>Nombre del Servicio</label>
                              <input type="text" required value={serviceName} onChange={(e) => setServiceName(e.target.value)} className="input" placeholder="Ej. Corte degradado" />
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                              <div>
                                <label className="kpi-card__label" style={{ marginBottom: "4px", display: "block" }}>Precio (€)</label>
                                <input type="number" required min="0" step="0.5" value={servicePrice} onChange={(e) => setServicePrice(e.target.value)} className="input" placeholder="15" />
                              </div>
                              <div>
                                <label className="kpi-card__label" style={{ marginBottom: "4px", display: "block" }}>Duración (mins)</label>
                                <input type="number" required min="5" value={serviceDuration} onChange={(e) => setServiceDuration(e.target.value)} className="input" placeholder="30" />
                              </div>
                            </div>

                            <div>
                              <label className="kpi-card__label" style={{ marginBottom: "4px", display: "block" }}>Descripción</label>
                              <textarea value={serviceDesc} onChange={(e) => setServiceDesc(e.target.value)} className="input" style={{ height: "60px", resize: "none" }} placeholder="Breve explicación del servicio..." />
                            </div>

                            <button type="submit" className="primary-btn" style={{ width: "100%", justifyContent: "center", marginTop: "10px" }}>
                              <span>Guardar Servicio</span>
                            </button>
                          </form>
                        </motion.div>
                      </div>
                    )}
                  </AnimatePresence>

                  {/* Bookings Management List */}
                  <section className="section-card">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
                      <h3 style={{ fontSize: "18px", fontWeight: "bold", margin: 0 }}>Gestión de Reservas ({filteredBusinessBookings.length})</h3>
                      <div style={{ position: "relative", width: "300px" }}>
                        <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                        <input
                          type="text"
                          className="input"
                          placeholder="Buscar por cliente, servicio o fecha..."
                          value={businessBookingSearch}
                          onChange={(e) => setBusinessBookingSearch(e.target.value)}
                          style={{ paddingLeft: "36px", fontSize: "13px", height: "36px" }}
                        />
                      </div>
                    </div>

                    <div className="table-scroll-wrapper">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th onClick={() => handleSortBookings('clientName')} style={{ cursor: 'pointer' }}>Cliente {renderSortIndicatorBookings('clientName')}</th>
                            <th onClick={() => handleSortBookings('serviceName')} style={{ cursor: 'pointer' }}>Servicio {renderSortIndicatorBookings('serviceName')}</th>
                            <th onClick={() => handleSortBookings('date')} style={{ cursor: 'pointer' }}>Fecha / Hora {renderSortIndicatorBookings('date')}</th>
                            <th onClick={() => handleSortBookings('price')} style={{ cursor: 'pointer' }}>Precio {renderSortIndicatorBookings('price')}</th>
                            <th onClick={() => handleSortBookings('status')} style={{ cursor: 'pointer' }}>Estado {renderSortIndicatorBookings('status')}</th>
                            <th style={{ textAlign: "right" }}>Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sortedBusinessBookings.length > 0 ? (
                            sortedBusinessBookings.map(b => (
                              <tr key={b.id}>
                                <td style={{ fontWeight: "bold" }}>{b.user?.fullName || `Cliente #${b.customerId}`}</td>
                                <td>{b.serviceName}</td>
                                <td>
                                  <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                                    <Clock size={14} style={{ color: "var(--primary)" }} /> {b.date} a las {b.time}
                                  </span>
                                </td>
                                <td style={{ fontWeight: "bold" }}>{b.service?.price || 15} €</td>
                                <td>
                                  <span className={`badge badge--${b.status}`}>
                                    {b.status === "pending" ? "Pendiente" : 
                                     b.status === "confirmed" ? "Confirmada" : 
                                     b.status === "paid" ? "Pagada" : 
                                     b.status === "cancelled" ? "Cancelada" : b.status}
                                  </span>
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
                                  {b.status === "paid" && (
                                    <span style={{ fontSize: "12px", color: "var(--info)", fontWeight: "bold" }}>✓ Pagada</span>
                                  )}
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={6} style={{ textAlign: "center", color: "var(--text-muted)", padding: "20px 0" }}>No hay reservas para este negocio.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </section>

                </div>
              )}
            </div>
          ) : (
            <div className="section-card" style={{ textAlign: "center", padding: "60px 20px" }}>
              <Building size={48} style={{ color: "var(--text-muted)", margin: "0 auto 16px", opacity: 0.3 }} />
              <h3 style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "8px" }}>Comienza a Digitalizar tu Negocio</h3>
              <p style={{ color: "var(--text-muted)", marginBottom: "24px", maxWidth: "460px", margin: "0 auto 24px" }}>Aún no has registrado ningún negocio. Crea tu primer local o salón comercial para comenzar a recibir reservas de tus clientes de forma automatizada.</p>
              <button className="primary-btn" onClick={() => setShowCreateBiz(true)} style={{ margin: "0 auto" }}>
                <Plus size={16} /> Crear mi primer negocio
              </button>
            </div>
          )}

        </motion.div>
      )}

      {/* -------------------- 3. SUPERADMIN VIEWS -------------------- */}
      {userRole === "superadmin" && viewMode === "real" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="page-stack">

          <section className="page-hero" style={{ background: "linear-gradient(135deg, rgba(244, 63, 94, 0.08) 0%, rgba(99, 102, 241, 0.04) 100%)", border: "1px solid rgba(255, 255, 255, 0.05)" }}>
            <div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(99, 102, 241, 0.15)", padding: "6px 12px", borderRadius: "20px", fontSize: "12px", color: "var(--primary)", fontWeight: "bold", marginBottom: "12px" }}>
                <ShieldCheck size={14} /> Control Maestro de Plataforma Activo
              </div>
              <h2>Consola de Superadministrador</h2>
              <p>Gestión global de negocios, auditorías técnicas, seguridad y métricas financieras.</p>
              <div style={{ marginTop: "20px", display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-muted)", fontSize: "14px" }}>Visualiza el panel como un cliente real sin salir del modo superadmin.</span>
                <button
                  className="secondary-btn"
                  onClick={handleEnterClientView}
                  style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "10px 16px" }}
                >
                  <Eye size={16} />
                  Vista Cliente
                </button>
              </div>
            </div>
          </section>

          {/* Global platform statistics */}
          <section className="kpi-grid">
            <div className="kpi-card" style={{ background: "rgba(255, 255, 255, 0.02)" }}>
              <p className="kpi-card__label">Negocios Totales</p>
              <h3 className="kpi-card__value">{superadminBusinesses.length}</h3>
              <p className="kpi-card__meta" style={{ color: "var(--text-muted)" }}>Salones registrados</p>
            </div>
            <div className="kpi-card" style={{ background: "rgba(255, 255, 255, 0.02)" }}>
              <p className="kpi-card__label">Reservas Globales</p>
              <h3 className="kpi-card__value" style={{ color: "var(--primary)" }}>{superadminBookings.length}</h3>
              <p className="kpi-card__meta kpi-card__meta--positive">
                <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                  <TrendingUp size={14} /> Total plataforma
                </span>
              </p>
            </div>
            <div className="kpi-card" style={{ background: "rgba(255, 255, 255, 0.02)" }}>
              <p className="kpi-card__label">Tasa de Cancelación</p>
              <h3 className="kpi-card__value" style={{ color: superadminBookings.length > 0 && (superadminBookings.filter(b => b.status === "cancelled").length / superadminBookings.length * 100) > 10 ? "var(--accent)" : "var(--success)" }}>
                {superadminBookings.length > 0 ? ((superadminBookings.filter(b => b.status === "cancelled").length / superadminBookings.length) * 100).toFixed(1) : "0.0"}%
              </h3>
              <p className="kpi-card__meta" style={{ color: "var(--text-muted)" }}>Global plataforma</p>
            </div>
            <div className="kpi-card" style={{ background: "rgba(255, 255, 255, 0.02)" }}>
              <p className="kpi-card__label">Estado del Sistema</p>
              <h3 className="kpi-card__value" style={{ color: "var(--success)" }}>99.9%</h3>
              <p className="kpi-card__meta kpi-card__meta--positive">Operativo</p>
            </div>
          </section>

          {/* Superadmin: Business administration and status */}
          <section className="section-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
              <h3 style={{ fontSize: "20px", fontWeight: "bold", margin: 0 }}>Gestión de Negocios y Estado ({filteredSuperadminBusinesses.length})</h3>
              <div style={{ position: "relative", width: "300px" }}>
                <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                <input
                  type="text"
                  className="input"
                  placeholder="Buscar por negocio, dueño, categoría..."
                  value={superadminSearch}
                  onChange={(e) => setSuperadminSearch(e.target.value)}
                  style={{ paddingLeft: "36px", fontSize: "13px", height: "36px" }}
                />
              </div>
            </div>

            <div className="table-scroll-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th onClick={() => handleSortBusinesses('name')} style={{ cursor: 'pointer' }}>Negocio {renderSortIndicatorBusinesses('name')}</th>
                    <th onClick={() => handleSortBusinesses('category')} style={{ cursor: 'pointer' }}>Categoría {renderSortIndicatorBusinesses('category')}</th>
                    <th onClick={() => handleSortBusinesses('city')} style={{ cursor: 'pointer' }}>Ubicación {renderSortIndicatorBusinesses('city')}</th>
                    <th onClick={() => handleSortBusinesses('owner')} style={{ cursor: 'pointer' }}>Propietario {renderSortIndicatorBusinesses('owner')}</th>
                    <th onClick={() => handleSortBusinesses('status')} style={{ cursor: 'pointer' }}>Estado de Cuenta {renderSortIndicatorBusinesses('status')}</th>
                    <th style={{ textAlign: "right" }}>Acciones Administrativas</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedSuperadminBusinesses.map(b => (
                    <tr key={b.id}>
                      <td style={{ fontWeight: "bold" }}>{b.name}</td>
                      <td>{b.category}</td>
                      <td>{b.city}</td>
                      <td>{b.owner?.fullName || "Desconocido"}</td>
                      <td>
                        {b.isSuspended ? (
                          <span className="badge" style={{ background: "rgba(244, 63, 94, 0.15)", color: "#f43f5e", border: "1px solid rgba(244, 63, 94, 0.2)" }}>SUSPENDIDO</span>
                        ) : (
                          <span className="badge" style={{ background: "rgba(16, 185, 129, 0.15)", color: "var(--success)", border: "1px solid rgba(16, 185, 129, 0.2)" }}>ACTIVO</span>
                        )}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div style={{ display: "inline-flex", gap: "8px" }}>

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

                          <button
                            className="danger-btn"
                            onClick={() => handleDeleteBusinessSuperClick(b.id, b.name)}
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
        </div>
      </footer>

      <AnimatePresence>
        {deleteServiceTarget !== null && (
          <div className="modal-backdrop">
            <motion.div 
              initial={{ scale: 0.95 }} 
              animate={{ scale: 1 }} 
              exit={{ scale: 0.95 }} 
              className="modal-card"
            >
              <div className="modal-icon warning" style={{ marginBottom: 20 }}>
                <AlertTriangle size={32} color="var(--warning)" />
              </div>
              <h3 className="modal-title">Eliminar Servicio</h3>
              <p className="modal-text">¿Seguro que deseas eliminar este servicio? Esta acción no se puede deshacer.</p>
              <div style={{ display: "flex", gap: 12, marginTop: 32, justifyContent: "flex-end" }}>
                <button 
                  type="button" 
                  className="secondary-btn" 
                  onClick={() => setDeleteServiceTarget(null)}
                >
                  Cancelar
                </button>
                <button 
                  type="button" 
                  className="danger-btn" 
                  onClick={confirmDeleteService}
                >
                  <Trash2 size={16} />
                  Confirmar eliminación
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {deleteBusinessTarget !== null && (
          <div className="modal-backdrop">
            <motion.div 
              initial={{ scale: 0.95 }} 
              animate={{ scale: 1 }} 
              exit={{ scale: 0.95 }} 
              className="modal-card"
            >
              <div className="modal-icon danger" style={{ marginBottom: 20 }}>
                <AlertTriangle size={32} color="var(--accent)" />
              </div>
              <h3 className="modal-title">Eliminar Negocio</h3>
              <p className="modal-text">¿Eliminar permanentemente <strong>{deleteBusinessTarget.name}</strong>? Esta acción no se puede deshacer.</p>
              <div style={{ display: "flex", gap: 12, marginTop: 32, justifyContent: "flex-end" }}>
                <button 
                  type="button" 
                  className="secondary-btn" 
                  onClick={() => setDeleteBusinessTarget(null)}
                >
                  Cancelar
                </button>
                <button 
                  type="button" 
                  className="danger-btn" 
                  onClick={confirmDeleteBusinessSuper}
                >
                  <Trash2 size={16} />
                  Confirmar eliminación
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        @media (max-width: 768px) {
          .responsive-profile-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

    </div>
  );
}
