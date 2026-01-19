"use client"
import { useRouter } from "next/navigation";
import UserDashboard from "../components/UserDashboard";
import { useEffect, useState } from "react";
import ParamountLoader from "../components/Loader";

export default function EmployeePage() {
    const router = useRouter();
        const [isLoading, setIsLoading] = useState(true);
        const [isAuthenticated, setIsAuthenticated] = useState(false);
    
        useEffect(() => {
            setIsLoading(true);
            const validateToken = async () => {
        
              if (typeof window === 'undefined') return;
        
              const token = localStorage.getItem("token");
              const user = localStorage.getItem("user");
              const role = localStorage.getItem("role");
              
              if (!token || !user || !role) {
                router.push("/login");
                return;
              }
        
              if (role != "employee") {
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
            setIsLoading(false);
          }, [router]);
          if (isLoading) { 
            return <ParamountLoader/>;
           } else if (!isAuthenticated) {
            return <div>Access Denied</div>;
          } else {  
        return(
            <UserDashboard/>
        );
    }
}