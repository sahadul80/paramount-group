// components/user/ProfileTab/InfoSection.tsx
import React from 'react';
import { motion } from 'framer-motion';

interface InfoSectionProps {
  title: string;
  icon: React.ReactNode;
  fields: { label: string; value: string }[];
}

const InfoSection: React.FC<InfoSectionProps> = ({ 
  title, 
  icon, 
  fields 
}) => (
  <motion.div 
    className="bg-card p-4 rounded-lg border-t border-b border-border"
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
  >
    <h3 className="text-lg font-semibold flex items-center gap-2 mb-2 text-primary">
      {icon} {title}
    </h3>
    <div className="space-y-3">
      {fields.map((field, index) => (
        <div key={index} className="flex flex-row sm:flex-row sm:items-center gap-1 sm:gap-4">
          <div className="w-32 text-sm font-medium text-muted-foreground">{field.label}</div>
          <div className="flex-1 text-foreground font-medium">{field.value}</div>
        </div>
      ))}
    </div>
  </motion.div>
);

export default InfoSection;