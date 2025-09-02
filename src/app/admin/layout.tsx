'use client';

import { ReactNode, useEffect, useState } from "react";
import UserTopBar from "../components/user/UserTopBar";
import { Toaster } from "sonner";
import { useRouter } from "next/navigation";
import { LogOutButton } from "../components/LogOutButton";

export default function AdminLayout({ children }: { children: ReactNode }) {
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
    <div className="min-h-screen flex flex-col">
      <Toaster />
      
      {/* Sticky top bar */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-2 py-1 bg-background shadow-sm">
        <UserTopBar />
        <LogOutButton username={username} />
      </header>

      {/* Main content */}
      <main className="flex-1 w-auto p-4 rounded-lg shadow-sm bg-muted/20">
        {children}
      </main>
    </div>
  );
}
