import { Booking } from '@/lib/types';
import { Payment } from '@/lib/types';

/**
 * Fetch aggregated metrics for a specific business.
 * Uses existing API endpoints to calculate totals.
 */
export async function getBusinessMetrics(businessId: string) {
  const [bookingsRes, paymentsRes, spotsRes] = await Promise.all([
    fetch(`/api/businesses/${businessId}/bookings`),
    fetch(`/api/businesses/${businessId}/payments`),
    fetch(`/api/businesses/${businessId}/spots`),
  ]);

  const bookings: Booking[] = await bookingsRes.json();
  const payments: Payment[] = await paymentsRes.json();
  const spots = await spotsRes.json();

  const totalReservations = bookings.length;
  const totalRevenue = payments.reduce((acc, p) => acc + Number(p.amount), 0);
  const totalCustomers = new Set(bookings.map((b) => b.clientId)).size;
  const totalServices = new Set(bookings.map((b) => b.serviceId)).size;
  const occupiedSpots = bookings.filter((b) => b.status === 'confirmed').length;
  const occupancyRate = spots.length ? (occupiedSpots / spots.length) * 100 : 0;
  const cancellations = bookings.filter((b) => b.status === 'cancelled').length;

  // Incomes by service (top 5)
  const incomeByService: Record<string, number> = {};
  bookings.forEach((b) => {
    const name = b.serviceName || 'Desconocido';
    const amount = Number(b.price || 0);
    incomeByService[name] = (incomeByService[name] || 0) + amount;
  });
  const topServices = Object.entries(incomeByService)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, amount]) => ({ name, amount }));

  return {
    totalReservations,
    totalRevenue,
    totalCustomers,
    totalServices,
    occupancyRate,
    cancellations,
    topServices,
  };
}
