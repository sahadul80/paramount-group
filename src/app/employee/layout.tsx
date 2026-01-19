'use client';

import { ReactNode, useEffect, useState } from "react";
import UserTopBar from "../components/user/UserTopBar";
import { Toaster } from "sonner";
import { useRouter } from "next/navigation";
import { LogOutButton } from "../components/LogOutButton";

export default function EmployeeLayout({ children }: { children: ReactNode }) {
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
    <div className="flex max-h-screen">
      <Toaster />
      <div className="flex flex-col flex-1 transition-all duration-300">
        {/* Sticky Top bar with logout */}
        <header className="sticky top-0 z-50 flex items-center justify-between p-2 md:p-3 bg-background shadow-sm">
          <UserTopBar />
          <LogOutButton username={username} />
        </header>
        {/* Main content */}
        <main className="flex flex-col bg-muted/20 flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
