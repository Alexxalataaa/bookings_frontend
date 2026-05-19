import DashboardClient from "./DashboardClient";
import AdminProtected from "../admin-protected";

export default function DashboardPage() {
  return (
    <AdminProtected>
      <DashboardClient />
    </AdminProtected>
  );
}

