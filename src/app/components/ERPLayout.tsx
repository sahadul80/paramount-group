"use client";

import { useEffect, useState } from "react";
import { SidebarProvider, SidebarTrigger } from "./ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { useRouter } from "next/navigation";
import { LogOutButton } from "./LogOutButton";

interface ERPLayoutProps {
  children: React.ReactNode;
}

export function ERPLayout({ children }: ERPLayoutProps) {
  const [username, setUsername] = useState<string>('');
  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUsername(storedUser);
    } else {
      router.push("/login");
    }
  }, [router]);

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
          <LogOutButton username={username}/>
          {/* Adjust top padding for fixed header */}
          <main className="flex-1 p-6 pt-20 bg-muted/20">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}