// components/user/ProfileTab/EditSection.tsx
import React from 'react';
import { motion } from 'framer-motion';

interface EditSectionProps {
  title: string;
  icon: React.ReactNode;
  fields: React.ReactNode;
}

const EditSection: React.FC<EditSectionProps> = ({ 
  title, 
  icon, 
  fields 
}) => (
  <motion.div 
    className="bg-card p-4 rounded-lg border"
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
  >
    <h3 className="text-lg font-semibold flex items-center gap-2 mb-4 text-primary">
      {icon} {title}
    </h3>
    <div className="space-y-1">
      {fields}
    </div>
  </motion.div>
);

export default EditSection;