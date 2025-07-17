"use client";
import { useState, useEffect } from "react";
import { Toaster } from "@/app/components/ui/toaster";
import { Toaster as Sonner } from "@/app/components/ui/sonner";
import { TooltipProvider } from "@/app/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ERPLayout } from "../components/ERPLayout";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react"; // Import loading spinner
import Dashboard from "../components/Dashboard";
import Inventory from "../components/Inventory";
import Manufacturing from "../components/Manufacturing";
import NotFound from "../components/NotFound";
import Purchase from "../components/Purchase";
import Sales from "../components/Sales";
import UserDashboard from "../components/UserDashboard";


const queryClient = new QueryClient();

export default function ERP() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const validateToken = async () => {
      const token = localStorage.getItem("token");
      const user = localStorage.getItem("user");
      
      if (!token || !user) {
        router.push("/login");
        return;
      }
  
      try {
        // Validate token with backend
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
        } else {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          localStorage.removeItem("role");
          router.push("/login");
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
    router.push('/');
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ERPLayout>
            <Routes>
              <Route path="/erp" element={<Dashboard />} />
              <Route path="/inventory" element={<Inventory />} />
              <Route path="/purchase" element={<Purchase />} />
              <Route path="/sales" element={<Sales />} />
              <Route path="/manufacturing" element={<Manufacturing />} />
              <Route path="/users" element={<UserDashboard />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </ERPLayout>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}