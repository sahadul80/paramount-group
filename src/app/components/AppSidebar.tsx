"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Package,
  ShoppingCart,
  Receipt,
  Truck,
  Boxes,
  Archive,
  X,
  PanelLeft,
  Users,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  useSidebar,
  SidebarMobileToggle,
} from "@/app/components/ui/sidebar";

const menuItems = [
  { title: "Dashboard", url: "/erp", icon: Archive },
  { title: "Inventory", url: "/erp/inventory", icon: Package },
  { title: "Purchase", url: "/erp/purchase", icon: ShoppingCart },
  { title: "Sales", url: "/erp/sales", icon: Receipt },
  { title: "Manufacturing", url: "/erp/manufacturing", icon: Truck },
  { title: "Users", url: "/erp/users", icon: Users },
];

export function AppSidebar() {
  const { state, openMobile } = useSidebar();
  const pathname = usePathname();
  const isCollapsed = state === "collapsed";

  return (
    <>
      <Sidebar
        className={`transition-all duration-300 border-r shrink-0 ${
          isCollapsed
            ? "w-16 bg-sidebar"
            : "w-64 bg-sidebar border border-sidebar-border"
        }`}
        collapsible="icon"
      >
        <SidebarContent>
          <div className="p-3 border-b border-sidebar-border">
            <div className="flex items-center gap-2">
              <Boxes className="h-6 w-6 sm:h-auto sm:w-auto text-primary" />
              {!isCollapsed && (
                <div className="transition-all duration-300 ease-out opacity-100 animate-fadeIn">
                  <h2 className="font-bold text-lg sm:text-xl">Paramount Agro</h2>
                  <p className="text-xs text-muted-foreground">
                    Management System
                  </p>
                </div>
              )}
              {isCollapsed && (
                <div className="transition-all duration-300 ease-in opacity-0 animate-fadeOut" />
              )}
            </div>
          </div>

          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {menuItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <Link
                      href={item.url}
                      className={`flex items-center w-full px-3 py-2 rounded-md transition-all duration-200 ${
                        pathname === item.url
                          ? "border-l-4 border-primary bg-black/20 text-primary dark:bg-white/20"
                          : "text-sidebar-foreground hover:bg-black/10 dark:hover:bg-white/10"
                      }`}
                    >
                      <item.icon className="h-5 w-5 transition-transform duration-200" />
                      {!isCollapsed && (
                        <span className="ml-3 transition-all duration-300 ease-out opacity-100 animate-fadeIn">
                          {item.title}
                        </span>
                      )}
                    </Link>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
    </>
  );
}
