"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster as Sonner, Toaster } from "@/app/components/ui/sonner";
import { TooltipProvider } from "@/app/components/ui/tooltip";
import { Loader2 } from "lucide-react";
import { ERPLayout } from "../components/ERPLayout";

const queryClient = new QueryClient();

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const validateToken = async () => {
      const token = localStorage.getItem("token");
      const user = localStorage.getItem("user");
      const role = localStorage.getItem("role");
      
      if (!token || !user || !role || role !== "erp") {
        router.push("/login");
        return;
      }
  
      try {
        const response = await fetch("/api/validate-token", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ user })
        });
        
        if (response.ok) {
          setIsAuthenticated(true);
        } 
      } catch (error) {
        console.error("Validation failed", error);
        router.push("/login");
      } finally {
        setIsLoading(false);
      }
    };
  
    validateToken();
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    router.push("/login");
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <ERPLayout>
          {children}
        </ERPLayout>
      </TooltipProvider>
    </QueryClientProvider>
  );
}