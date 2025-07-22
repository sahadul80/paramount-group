// app/demand/layout.tsx
'use client';

import TopBar from "@/app/components/Demand/TopBar";
import { ReactNode } from "react";

export default function DemandLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900 p-2 sm:p-4">
      <TopBar />
      <div className="w-full max-w-2xl mx-auto shadow-sm rounded-lg border-0 bg-white dark:bg-gray-800">
        {children}
      </div>
    </div>
  );
}
