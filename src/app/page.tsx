"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(true); // for UI state

  useEffect(() => {
    // Run only after DOM is fully ready
    const timeout = setTimeout(() => {
      const token = localStorage.getItem("token");
      const user = localStorage.getItem("user");
      const role = localStorage.getItem("role");

      if (token && user && role) {
        router.push(`/${role}`);
      } else {
        router.push("/login");
      }
    }, 0); // delay ensures it's executed after hydration

    return () => clearTimeout(timeout);
  }, [router]);

  // Optional: return null to avoid flash
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-500" />
    </div>
  );
}
