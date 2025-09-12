// components/user/ProfileTab/InfoSection.tsx
import React from 'react';
import { motion } from 'framer-motion';

interface InfoSectionProps {
  title: string;
  icon: React.ReactNode;
  fields: { label: string; value: string; ref?: string; }[];
}

const InfoSection: React.FC<InfoSectionProps> = ({ 
  title, 
  icon, 
  fields
}) => (
  <motion.div 
    className="bg-card p-2 rounded-lg border-t border-b border-border"
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
  >
    <h3 className="text-lg font-semibold flex items-center gap-2 mb-2 text-primary">
      {icon} {title}
    </h3>
    <div className="flex flex-col space-y-3">
      {fields.map((field, index) => (
        <div key={index} className="flex flex-row gap-4">
          <div className="w-1/3 text-sm font-medium text-muted-foreground flex justify-start">{field.label}</div>
          {field.ref ? (
          <a href={`${field.ref}:${field.value}`} className='w-2/3 text-primary text-sm font-bold  flex justify-start break-all hover:text-secondary'>{field.value}</a>
        ) : (
          <div className="w-2/3 text-foreground text-sm font-bold flex justify-start break-all">
            {field.value}
          </div>
          )}
        </div>
      ))}
    </div>
  </motion.div>
);

export default InfoSection;