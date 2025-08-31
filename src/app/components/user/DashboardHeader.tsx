// components/user/DashboardHeader.tsx
import React from 'react';
import { motion } from 'framer-motion';

const DashboardHeader: React.FC = () => {
  return (
    <div className="flex flex-col gap-4 mb-6">
      <div className="flex justify-between items-center">
        <motion.h2 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent"
        >
          User Dashboard
        </motion.h2>
      </div>
    </div>
  );
};

export default DashboardHeader;