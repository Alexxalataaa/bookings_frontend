import { Booking } from '@/lib/types';
import { Payment } from '@/lib/types';

/**
 * Fetch client‑level aggregated metrics.
 * The endpoint should return all bookings/payments for the given client.
 */
export async function getClientMetrics(clientId: string) {
  const [bookingsRes, paymentsRes] = await Promise.all([
    fetch(`/api/clients/${clientId}/bookings`),
    fetch(`/api/clients/${clientId}/payments`),
  ]);

  const bookings: Booking[] = await bookingsRes.json();
  const payments: Payment[] = await paymentsRes.json();

  const totalReservations = bookings.length;
  const totalSpent = bookings.reduce((a, b) => a + Number(b.price || 0), 0);
  const averageBookingValue = totalReservations ? totalSpent / totalReservations : 0;

  const totalPayments = payments.reduce((a, p) => a + Number(p.amount || 0), 0);
  const pendingPayments = payments
    .filter(p => p.status === 'pending')
    .reduce((a, p) => a + Number(p.amount || 0), 0);

  // Simple occupancy: assume spots total is fetched from a generic endpoint
  const spotsRes = await fetch('/api/spots');
  const totalSpots = (await spotsRes.json()).length;
  const occupiedSpots = bookings.filter(b => b.status === 'confirmed').length;
  const occupancyRate = totalSpots ? (occupiedSpots / totalSpots) * 100 : 0;

  // Top services by count
  const serviceCounts: Record<string, number> = {};
  bookings.forEach(b => {
    const name = b.serviceName || 'Desconocido';
    serviceCounts[name] = (serviceCounts[name] || 0) + 1;
  });
  const topServices = Object.entries(serviceCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name, count]) => ({ name, count }));

  return {
    totalReservations,
    totalSpent,
    averageBookingValue,
    totalPayments,
    pendingPayments,
    occupancyRate,
    topServices,
  };
}
