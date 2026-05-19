"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Activity } from "lucide-react";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
    
    if (token) {
      router.replace("/dashboard");
    } else {
      router.replace("/login");
    }
  }, [router]);

  return (
    <div style={{ 
      minHeight: "100vh", 
      display: "flex", 
      alignItems: "center", 
      justifyContent: "center",
      background: "var(--bg)",
      color: "var(--text-muted)"
    }}>
      <div style={{ textAlign: "center" }}>
        <Activity size={40} style={{ margin: "0 auto 16px", opacity: 0.3 }} />
        <p>Redirigiendo...</p>
      </div>
    </div>
  );
}
