"use client";

import { useEffect, useState } from "react";
import { SidebarProvider, SidebarTrigger } from "./ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { useRouter } from "next/navigation";
import { LogOutButton } from "./LogOutButton";
import UserTopBar from "./user/UserTopBar";

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
        <AppSidebar />
        <div className="flex-1 flex flex-col md:ml-[var(--sidebar-width)] transition-all duration-300">
          <UserTopBar />
          <main className="flex-1 p-4 bg-muted/20">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}