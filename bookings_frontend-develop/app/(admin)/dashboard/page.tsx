import DashboardClient from "./DashboardClient";
import { getAppointments, getCustomers, getPayments } from "@/lib/api";

export default async function DashboardPage() {
  const [bookings, customers, payments] = await Promise.all([
    getAppointments(),
    getCustomers(),
    getPayments(),
  ]);

  return (
    <DashboardClient 
      initialBookings={bookings} 
      initialCustomers={customers} 
      initialPayments={payments} 
    />
  );
}