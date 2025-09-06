import { motion } from "framer-motion";
import { useState, useEffect } from 'react';
import { FiMenu } from "react-icons/fi";
import { AppSidebar } from "../AppSidebar";
import { Sidebar, SidebarMobileToggle, SidebarProvider } from "../ui/sidebar";

export default function UserTopBar() {
  const [user, setUser] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  useEffect(() => {
    setUser(localStorage.getItem('user'));
    setRole(localStorage.getItem('role'));
  }, []);

  return (
    <div className="sticky top-0 z-10 bg-secondary/20 backdrop-blur-lg py-2 md:py-3 sm:px-10 flex justify-between items-center gap-4">
      <div className="md:hidden bg-secondary rounded-md max-h-10">
        <SidebarProvider>
          <Sidebar>
            <AppSidebar />
          </Sidebar>
          <SidebarMobileToggle className="md:hidden">
            <FiMenu />
          </SidebarMobileToggle>
        </SidebarProvider>
      </div>
      <motion.h2 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent"
      >
        {role?.toLocaleUpperCase()} Dashboard
      </motion.h2>
    </div>
  );
}