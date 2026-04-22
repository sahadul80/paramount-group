"use client"
import { motion } from "framer-motion";
import { useState, useEffect } from 'react';

export default function UserTopBar() {
  const [user, setUser] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  useEffect(() => {
    setUser(localStorage.getItem('user'));
    setRole(localStorage.getItem('role'));
  }, []);

  return (
    <div className="flex items-center gap-4">
      <motion.h2 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xl md:text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent"
      >
        {role?.toLocaleUpperCase()} Dashboard
      </motion.h2>
    </div>
  );
}