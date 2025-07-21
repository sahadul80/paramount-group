"use client";

import { useEffect, useState } from "react";
import { SidebarProvider, SidebarTrigger } from "./ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { LogOut } from "lucide-react";
import { Button } from "./ui/button";
import { useRouter } from "next/navigation";

interface ERPLayoutProps {
  children: React.ReactNode;
}

export function ERPLayout({ children }: ERPLayoutProps) {
  const [username, setUsername] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUsername(storedUser);
    } else {
      router.push("/login");
    }
  }, [router]);

  function LogoutButton() {
    function handleLogout() {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("role");
      router.push("/login");       
    };

    return (
      <div className="absolute z-50 fixed top-2 md:top-4 right-4">
        <div className="backdrop-blur-md bg-black/10 border border-red-500 rounded-lg">
          <Button onClick={handleLogout} className="font-bold text-red-500 flex items-center">
            <LogOut className="h-4 w-4 text-red-500" />
            <span className="hidden md:inline">Logout</span>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        {/* Sidebar */}
        <AppSidebar />

        {/* Main content */}
        <div className="flex-1 flex flex-col md:ml-[var(--sidebar-width)] transition-all duration-300">
          {/* Fixed Header */}
          <header className="h-16 md:h-19.5 fixed top-0 w-full border-b bg-card flex items-center px-6 gap-4 backdrop-blur-md bg-black/10">
            <SidebarTrigger className="inline md:hidden" />
            <div className="flex-1">
              <h1 className="text-xl font-semibold text-foreground">
                Welcome{username ? `, ${username.toUpperCase()}` : ""}
              </h1>
            </div>
          </header>
          <LogoutButton/>
          {/* Adjust top padding for fixed header */}
          <main className="flex-1 p-6 pt-20 bg-muted/20">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}