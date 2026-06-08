import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getClientMetrics } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { Calendar as CalendarIcon, CreditCard, TrendingUp, BarChart, Users, CheckCircle, AlertCircle } from "lucide-react";
import KpiCard from "@/components/kpi/KpiCard";

export default function ClientDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<any>(null);

  // Retrieve logged‑in client id from localStorage (token payload assumed)
  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      router.push("/login");
      return;
    }
    const storedId = localStorage.getItem("user_id");
    setUserId(storedId ?? null);
  }, []);

  useEffect(() => {
    if (!userId) return;
    const fetchMetrics = async () => {
      try {
        const data = await getClientMetrics(userId);
        setMetrics(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
  }, [userId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0b0d11] text-white">
        <AlertCircle className="mr-2" /> Cargando datos...
      </div>
    );
  }

  // Guard against missing metrics
  const {
    totalReservations = 0,
    totalSpent = 0,
    pendingPayments = 0,
    averageBookingValue = 0,
    occupancyRate = 0,
    topServices = [],
  } = metrics || {};

  return (
    <div className="min-h-screen bg-[#0b0d11] text-white p-6">
      <h1 className="text-3xl font-bold mb-6">Mi Panel de Cliente</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <KpiCard
          label="Total de reservas"
          value={totalReservations}
          icon={<CalendarIcon className="text-purple-400" size={24} />}
        />
        <KpiCard
          label="Facturación total"
          value={formatCurrency(totalSpent)}
          icon={<TrendingUp className="text-purple-400" size={24} />}
        />
        <KpiCard
          label="Pagos pendientes"
          value={formatCurrency(pendingPayments)}
          icon={<CreditCard className="text-purple-400" size={24} />}
        />
        <KpiCard
          label="Valor medio reserva"
          value={formatCurrency(averageBookingValue)}
          icon={<BarChart className="text-purple-400" size={24} />}
        />
        <KpiCard
          label="Ocupación (%)"
          value={`${occupancyRate.toFixed(1)}%`}
          icon={<Users className="text-purple-400" size={24} />}
        />
        <KpiCard
          label="Servicios top"
          value={topServices.map((s: any) => s.name).join(", ")}
          icon={<CheckCircle className="text-purple-400" size={24} />}
        />
      </div>
    </div>
  );
}
