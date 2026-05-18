import CustomersClient from "./CustomersClient";
import { getCustomers } from "@/lib/api";

export default async function CustomersPage() {
  const customers = await getCustomers();

  return <CustomersClient initialCustomers={customers} />;
}