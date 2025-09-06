// components/user/ProfileTab/FormField.tsx
import React from 'react';
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { FiAlertCircle } from 'react-icons/fi';
import { cn } from '@/app/lib/utils';

interface FormFieldProps {
  label: string;
  value: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  type?: string;
  error?: string;
  tip?: string;
  required?: boolean;
}

const FormField: React.FC<FormFieldProps> = ({ 
  label, 
  value, 
  onChange, 
  disabled = false, 
  type = 'text', 
  error, 
  tip, 
  required 
}) => (
  <div className="flex flex-col-2">
    <Label className="text-foreground w-30 p-2">
      {label} {required && <span className="text-destructive">*</span>}
    </Label>
    <div className='flex flex-col'>
      <Input
        type={type}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={cn(
          "bg-background border-border text-sm h-8 w-auto",
          disabled && "bg-muted cursor-not-allowed",
          error && "border-destructive"
        )}
      />
      {error && (
        <p className="text-destructive text-sm flex items-center gap-1">
          <FiAlertCircle className="w-4 h-4" /> {error}
        </p>
      )}
      {tip && !error && (
        <p className="text-muted-foreground text-xs">{tip}</p>
      )}
    </div>
  </div>
);

export default FormField;