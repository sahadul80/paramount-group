"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FiPackage,
  FiShoppingCart,
  FiFileText,
  FiTruck,
  FiArchive,
  FiUsers,
  FiHome,
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { useSidebar } from "./ui/sidebar"; // ✅ use context

const menuItems = [
  { title: "Dashboard", url: "/erp", icon: FiArchive },
  { title: "Inventory", url: "/erp/inventory", icon: FiPackage },
  { title: "Purchase", url: "/erp/purchase", icon: FiShoppingCart },
  { title: "Sales", url: "/erp/sales", icon: FiFileText },
  { title: "Manufacturing", url: "/erp/manufacturing", icon: FiTruck },
  { title: "Users", url: "/erp/users", icon: FiUsers },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { state, toggleSidebar, isMobile } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <>
      <motion.div
        initial={{ width: isCollapsed ? 64 : 256 }}
        animate={{ width: isCollapsed ? 64 : 256 }}
        transition={{ duration: 0.3 }}
        className={`fixed inset-y-0 left-0 z-40 bg-background overflow-hidden ${
          isCollapsed ? "w-16" : "w-64"
        }`}
      >
        {/* Header with toggle button */}
        <div
          className="p-2 cursor-pointer hover:bg-black/5 transition-colors"
          onClick={() => toggleSidebar()}
        >
          <div className="hidden md:flex items-center gap-2">
            <FiHome className="h-10 w-10 text-primary flex-shrink-0" />
            <AnimatePresence mode="wait">
              {!isCollapsed && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <h2 className="font-bold text-lg whitespace-nowrap">
                    Paramount Agro
                  </h2>
                  <p className="text-xs text-muted-foreground whitespace-nowrap">
                    Management System
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Nav links */}
        <nav>
          <ul className="space-y-2">
            {menuItems.map((item) => (
              <li key={item.title} data-sidebar-item>
                <Link
                  href={item.url}
                  className={`flex items-center w-full px-3 py-3 rounded-md transition-all duration-200 ${
                    pathname === item.url
                      ? "border-l-4 border-primary bg-black/20 dark:bg-white/20"
                      : "text-sidebar-foreground hover:bg-black/10 dark:hover:bg-white/10"
                  }`}
                  onClick={() => {
                    if (isMobile) toggleSidebar();
                  }}
                >
                  <item.icon className="h-6 w-6 flex-shrink-0" />
                  <AnimatePresence mode="wait">
                    {!isCollapsed && (
                      <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: "auto" }}
                        exit={{ opacity: 0, width: 0 }}
                        transition={{ duration: 0.2 }}
                        className="ml-3 whitespace-nowrap overflow-hidden"
                      >
                        {item.title}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </motion.div>

      {/* Main content padding (shifts when collapsed/expanded) */}
      <motion.div
        initial={{ paddingLeft: isCollapsed ? 64 : 256 }}
        animate={{ paddingLeft: isCollapsed ? 64 : 256 }}
        transition={{ duration: 0.3 }}
        className="min-h-screen transition-all duration-300"
      />
    </>
  );
}
