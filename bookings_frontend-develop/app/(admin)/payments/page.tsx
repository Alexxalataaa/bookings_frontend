import PaymentsClient from "./PaymentsClient";
import { getPayments } from "@/lib/api";

export default async function PaymentsPage() {
  const payments = await getPayments();

  return <PaymentsClient initialPayments={payments} />;
}