// app/demand/layout.tsx
'use client';

import { ReactNode } from "react";
import UserTopBar from "../components/user/UserTopBar";
import { Toaster } from "sonner";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="">
      <Toaster/>
      <UserTopBar/>
      <div className="w-auto shadow-sm rounded-lg p-5">
        {children}
      </div>
    </div>
  );
}