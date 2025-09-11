'use client'
import React, { useState } from 'react';
import { FiDollarSign, FiTrendingUp, FiInfo } from 'react-icons/fi';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { motion } from 'framer-motion';

interface SalaryAdjustmentProps {
  currentSalary: number;
  onSalaryAdjust: (newSalary: number) => void;
}

const SalaryAdjustment: React.FC<SalaryAdjustmentProps> = ({ currentSalary, onSalaryAdjust }) => {
  const [adjustmentType, setAdjustmentType] = useState<'percentage' | 'fixed'>('percentage');
  const [adjustmentValue, setAdjustmentValue] = useState('');
  const [reason, setReason] = useState('');

  const calculateNewSalary = () => {
    const value = parseFloat(adjustmentValue) || 0;
    
    if (adjustmentType === 'percentage') {
      return currentSalary + (currentSalary * value / 100);
    } else {
      return currentSalary + value;
    }
  };

  const newSalary = calculateNewSalary();
  const difference = newSalary - currentSalary;

  const handleSubmit = () => {
    onSalaryAdjust(newSalary);
    setAdjustmentValue('');
    setReason('');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-4"
    >
      <div>
        <h3 className="text-lg font-semibold text-card-foreground">Salary Adjustment</h3>
        <p className="text-sm text-muted-foreground">Manage and request salary adjustments</p>
      </div>

      {/* Current Salary Card */}
      <Card className="border-border bg-gradient-to-br from-card to-card/80">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <FiDollarSign className="w-5 h-5" />
            Current Salary
          </CardTitle>
          <CardDescription>Your current monthly salary</CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="text-3xl font-bold text-card-foreground">
            {formatCurrency(currentSalary)}
          </div>
          <div className="text-sm text-muted-foreground mt-2">
            Last updated: {new Date().toLocaleDateString()}
          </div>
        </CardContent>
      </Card>

      {/* Adjustment Calculator */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle>Salary Adjustment Calculator</CardTitle>
          <CardDescription>Calculate potential salary adjustments</CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Adjustment Type</label>
              <Select value={adjustmentType} onValueChange={(value: 'percentage' | 'fixed') => setAdjustmentType(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage (%)</SelectItem>
                  <SelectItem value="fixed">Fixed Amount</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium">
                {adjustmentType === 'percentage' ? 'Percentage' : 'Amount'}
              </label>
              <Input
                type="number"
                value={adjustmentValue}
                onChange={(e) => setAdjustmentValue(e.target.value)}
                placeholder={adjustmentType === 'percentage' ? 'Enter percentage' : 'Enter amount'}
                step={adjustmentType === 'percentage' ? 0.1 : 1}
              />
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium">Reason for Adjustment</label>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter reason for adjustment"
            />
          </div>
          
          {/* Result Preview */}
          {adjustmentValue && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="p-4 rounded-lg bg-muted"
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Current Salary</div>
                  <div className="text-lg font-semibold">{formatCurrency(currentSalary)}</div>
                </div>
                
                <div>
                  <div className="text-sm text-muted-foreground">New Salary</div>
                  <div className="text-lg font-semibold text-success">{formatCurrency(newSalary)}</div>
                </div>
              </div>
              
              <div className="mt-3 pt-3 border-t border-border">
                <div className="text-sm">
                  Difference: <span className={difference >= 0 ? 'text-success' : 'text-destructive'}>
                    {difference >= 0 ? '+' : ''}{formatCurrency(difference)}
                  </span>
                </div>
              </div>
            </motion.div>
          )}
          
          <Dialog>
            <DialogTrigger asChild>
              <Button 
                className="w-full" 
                disabled={!adjustmentValue || !reason}
              >
                Request Adjustment
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirm Salary Adjustment</DialogTitle>
                <DialogDescription>
                  This will submit a request for salary adjustment to HR for review.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-muted">
                  <div className="text-sm text-muted-foreground">Current Salary</div>
                  <div className="text-xl font-semibold">{formatCurrency(currentSalary)}</div>
                  
                  <div className="text-sm text-muted-foreground mt-3">Proposed Salary</div>
                  <div className="text-xl font-semibold text-success">{formatCurrency(newSalary)}</div>
                  
                  <div className="text-sm text-muted-foreground mt-3">Difference</div>
                  <div className="text-lg font-semibold text-success">
                    {difference >= 0 ? '+' : ''}{formatCurrency(difference)}
                  </div>
                  
                  <div className="text-sm text-muted-foreground mt-3">Reason</div>
                  <div className="text-sm">{reason}</div>
                </div>
                
                <Button onClick={handleSubmit} className="w-full">
                  Confirm Request
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      {/* Information */}
      <Card className="border-border">
        <CardContent className="p-4 flex items-start gap-3">
          <FiInfo className="w-5 h-5 text-primary mt-0.5" />
          <div className="text-sm text-muted-foreground">
            Salary adjustment requests will be reviewed by HR and management. 
            Approved adjustments will be reflected in the next payroll cycle.
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default SalaryAdjustment;