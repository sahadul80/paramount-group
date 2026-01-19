"use client"
import { useEffect, useState } from "react";
import UserDashboard from "../components/UserDashboard";
import { useRouter } from "next/navigation";

export default function AdminPage(){
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        const validateToken = async () => {
    
          if (typeof window === 'undefined') return;
    
          const token = localStorage.getItem("token");
          const user = localStorage.getItem("user");
          const role = localStorage.getItem("role");
          
          if (!token || !user || !role) {
            router.push("/login");
            return;
          }
    
          if (role != "admin") {
            router.push("/login");
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
    return(
        <UserDashboard/>
    );
}