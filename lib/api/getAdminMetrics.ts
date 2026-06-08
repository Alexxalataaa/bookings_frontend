import { Booking } from '@/lib/types';
import { Payment } from '@/lib/types';

/**
 * Fetch admin‑level aggregated metrics.
 * This wrapper merges data from existing endpoints.
 */
export async function getAdminMetrics() {
  // Assume the backend provides these generic endpoints.
  const [usersRes, clientsRes, businessesRes, bookingsRes, paymentsRes] = await Promise.all([
    fetch('/api/users'),
    fetch('/api/clients'),
    fetch('/api/businesses'),
    fetch('/api/bookings'),
    fetch('/api/payments'),
  ]);

  const users = await usersRes.json();
  const clients = await clientsRes.json();
  const businesses = await businessesRes.json();
  const bookings: Booking[] = await bookingsRes.json();
  const payments: Payment[] = await paymentsRes.json();

  // ---- Basic counts ----
  const totalUsers = users.length;
  const totalClients = clients.length;
  const totalBusinesses = businesses.length;
  const totalReservations = bookings.length;

  // ---- Payments ----
  const totalPaymentsToday = payments
    .filter((p) => new Date(p.date).toDateString() === new Date().toDateString())
    .reduce((acc, p) => acc + Number(p.amount), 0);
  const totalPending = payments
    .filter((p) => p.status === 'pending')
    .reduce((acc, p) => acc + Number(p.amount), 0);

  // ---- Income ----
  const totalRevenue = payments.reduce((acc, p) => acc + Number(p.amount), 0);
  const revenueByMonth: Record<string, number> = {};
  payments.forEach((p) => {
    const month = new Date(p.date).toISOString().slice(0, 7); // YYYY‑MM
    revenueByMonth[month] = (revenueByMonth[month] || 0) + Number(p.amount);
  });
  // Average booking value across all bookings
  const averageBookingValue = totalRevenue / (totalReservations || 1);
  // Simple month‑over‑month growth percentage (compare latest month to previous)
  const sortedMonths = Object.keys(revenueByMonth).sort();
  const latestMonth = sortedMonths[sortedMonths.length - 1];
  const previousMonth = sortedMonths[sortedMonths.length - 2];
  const revenueGrowthMoM = previousMonth
    ? ((revenueByMonth[latestMonth] - revenueByMonth[previousMonth]) / revenueByMonth[previousMonth]) * 100
    : 0;


  // ---- Growth ----
  const usersByMonth: Record<string, number> = {};
  users.forEach((u: any) => {
    const month = new Date(u.createdAt).toISOString().slice(0, 7);
    usersByMonth[month] = (usersByMonth[month] || 0) + 1;
  });

  // ---- Occupancy (spots) ----
  const occupiedSpots = bookings.filter((b) => b.status === 'confirmed').length; // simplistic
  const totalSpotsRes = await fetch('/api/spots');
  const totalSpots = await totalSpotsRes.json();
  const occupancyRate = totalSpots.length ? (occupiedSpots / totalSpots.length) * 100 : 0;

  // ---- Top services & businesses ----
  const serviceCounts: Record<string, number> = {};
  bookings.forEach((b) => {
    const name = b.serviceName || 'Desconocido';
    serviceCounts[name] = (serviceCounts[name] || 0) + 1;
  });
  const topServices = Object.entries(serviceCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));

  const businessCounts: Record<string, number> = {};
  bookings.forEach((b) => {
    const name = b.businessName || 'Desconocido';
    businessCounts[name] = (businessCounts[name] || 0) + 1;
  });
  const topBusinesses = Object.entries(businessCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));

  return {
    totalUsers,
    totalClients,
    totalBusinesses,
    totalReservations,
    totalPaymentsToday,
    totalPending,
    totalRevenue,
    revenueByMonth,
    usersByMonth,
    occupancyRate,
    topServices,
    topBusinesses,
    averageBookingValue,
    revenueGrowthMoM,
  };
}
