'use client'
import { LogOutButton } from "../LogOutButton";
import { useState, useEffect } from 'react'; // Import hooks

export default function TopBar() {
  const [user, setUser] = useState<string | null>(null); // Initialize state

  useEffect(() => {
    // This effect runs only on the client side
    setUser(localStorage.getItem('user'));
  }, []);

  return (
    <div className="sticky top-0 z-10 bg-gray-50 dark:bg-gray-900 py-3 px-2 sm:px-4 flex justify-between items-center mb-2 sm:mb-4 border-b">
      <h1 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white">
        Demand Form
      </h1>
      {user ? <LogOutButton username={user} /> : null}
    </div>
  );
}