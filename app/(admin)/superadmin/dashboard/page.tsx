"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardClient from "../../dashboard/DashboardClient";

export default function SuperadminDashboardPage() {
  const [authorized, setAuthorized] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const role = localStorage.getItem("user_role");
    if (role !== "superadmin") {
      router.replace("/dashboard");
      return;
    }

    setAuthorized(true);
  }, [router]);

  if (!authorized) {
    return null;
  }

  return <DashboardClient />;
}
