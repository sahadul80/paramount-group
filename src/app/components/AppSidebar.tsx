"use client";

import { NavLink } from "react-router-dom";
import {
  Package,
  ShoppingCart,
  Receipt,
  Truck,
  Boxes,
  Archive,
  X,
  PanelLeft,
  Users, // Add this import
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  useSidebar,
  SidebarMobileToggle, // Make sure this is imported
} from "@/app/components/ui/sidebar";

const menuItems = [
  { title: "Dashboard", url: "/erp", icon: Archive },
  { title: "Inventory", url: "/inventory", icon: Package },
  { title: "Purchase", url: "/purchase", icon: ShoppingCart },
  { title: "Sales", url: "/sales", icon: Receipt },
  { title: "Manufacturing", url: "/manufacturing", icon: Truck },
  { title: "Users", url: "/users", icon: Users },
];

export function AppSidebar() {
  const { state, openMobile } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <>
      <SidebarMobileToggle className="flex top-4 left-4 z-50 bg-primary text-primary-foreground rounded-full p-2 shadow-lg hover:bg-primary/90 transition-all">
        {openMobile ? (
          <X className="h-6 w-6" />
        ) : (
          <PanelLeft className="h-6 w-6" />
        )}
      </SidebarMobileToggle>

      <Sidebar
        className={`transition-all duration-300 border-r shrink-0 ${
          isCollapsed
            ? "w-16 bg-sidebar"
            : "w-64 bg-sidebar border border-sidebar-border"
        }`}
        collapsible="icon"
      >
        <SidebarContent>
          <div className="p-4 border-b border-sidebar-border">
            <div className="flex items-center gap-2">
              <Boxes className="h-6 w-6 sm:h-10 sm:w-10 text-primary" />
              {!isCollapsed && (
                <div className="transition-all duration-300 ease-out opacity-100 animate-fadeIn">
                  <h2 className="font-bold text-md sm:text-lg">TextileERP</h2>
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
                    <NavLink
                      to={item.url}
                      end
                      className={({ isActive }) =>
                        `flex items-center w-full px-3 py-2 rounded-md transition-all duration-200 ${
                          isActive
                            ? "border-l-4 border-primary bg-black/20 text-primary dark:bg-white/20"
                            : "text-sidebar-foreground hover:bg-black/10 dark:hover:bg-white/10"
                        }`
                      }
                    >
                      <item.icon className="h-5 w-5 transition-transform duration-200" />
                      {!isCollapsed && (
                        <span className="ml-3 transition-all duration-300 ease-out opacity-100 animate-fadeIn">
                          {item.title}
                        </span>
                      )}
                    </NavLink>
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