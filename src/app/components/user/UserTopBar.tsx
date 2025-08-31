'use client'
import { motion } from "framer-motion";
import { LogOutButton } from "../LogOutButton";
import { useState, useEffect } from 'react'; // Import hooks

export default function UserTopBar() {
  const [user, setUser] = useState<string | null>(null); // Initialize state
  const [role, setRole] = useState<string | null>(null);
  useEffect(() => {
    // This effect runs only on the client side
    setUser(localStorage.getItem('user'));
    setRole(localStorage.getItem('role'));
  }, []);

  return (
    <div className="sticky top-0 z-10 bg-gray-50 dark:bg-gray-900 py-5 px-2 sm:px-10 flex justify-between items-center border-b">
        <motion.h2 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent"
        >
            {role?.toLocaleUpperCase()} Dashboard
        </motion.h2>
        {user ? <LogOutButton username={user} /> : null}
    </div>
  );
}