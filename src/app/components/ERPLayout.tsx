"use client";

import { useEffect, useState } from "react";
import { SidebarProvider } from "./ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { useRouter } from "next/navigation";
import { LogOutButton } from "./LogOutButton";
import UserTopBar from "./user/UserTopBar";

interface ERPLayoutProps {
  children: React.ReactNode;
}

export function ERPLayout({ children }: ERPLayoutProps) {
  const [username, setUsername] = useState<string>("");
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
    <div className="flex min-h-screen">
      <SidebarProvider>
        <AppSidebar />

        <div className="flex flex-col flex-1 transition-all duration-200">
          {/* Sticky Top bar with logout */}
          <header className="sticky top-0 z-50 flex items-center justify-between px-2 py-1 bg-background shadow-sm">
            <UserTopBar />
            <LogOutButton username={username} />
          </header>

          {/* Main content */}
          <main className="flex flex-col p-4 bg-muted/20 flex-1">
            {children}
          </main>
        </div>
      </SidebarProvider>
    </div>
  );
}