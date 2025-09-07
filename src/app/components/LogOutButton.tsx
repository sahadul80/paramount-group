"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import { Button } from "./ui/button";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

interface LogoutButtonProps {
  username: string;
}

export function LogOutButton({ username }: LogoutButtonProps) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    
    try {
      // Update user status
      await fetch("/api/user/update-status", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, status: 4 })
      });

      // Clear storage and redirect
      localStorage.clear();
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <>
      {/* Floating Logout Button */}
      <motion.div
        className="flex"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Button
          variant="destructive"
          size="icon"
          onClick={() => setShowConfirmation(true)}
          className="shadow-lg rounded-lg w-auto px-3"
          aria-label="Logout"
        >
          <LogOut/><span className="hidden md:flex">Log Out</span>
        </Button>
      </motion.div>

      {/* Confirmation Dialog with Overlay */}
      <AnimatePresence>
        {showConfirmation && (
          <>
            {/* Darkened Background Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
              onClick={() => setShowConfirmation(false)}
            />
            
            {/* Centered Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div 
                className="bg-background border border-border rounded-xl shadow-lg p-6 max-w-md w-full mx-4"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="text-center space-y-4">
                  <div className="mx-auto bg-destructive/10 text-destructive rounded-full w-12 h-12 flex items-center justify-center">
                    <LogOut className="h-6 w-6" />
                  </div>
                  
                  <h3 className="text-lg font-semibold">Log out?</h3>
                  <p className="text-muted-foreground text-sm">
                    Are you sure you want to sign out?
                  </p>
                  
                  <div className="flex gap-3 pt-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowConfirmation(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleLogout}
                      disabled={isLoggingOut}
                      className="flex-1"
                    >
                      {isLoggingOut ? (
                        <div className="flex items-center justify-center">
                          <motion.span
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="block w-4 h-4 border-2 border-t-transparent border-current rounded-full"
                          />
                        </div>
                      ) : (
                        "Logout"
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}