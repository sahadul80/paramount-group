'use client'
import React, { useState } from 'react';
import { MealRecord } from '@/types/users';
import { FiCoffee, FiPlus, FiTrendingUp } from 'react-icons/fi';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { motion } from 'framer-motion';

interface MealTrackerProps {
  mealRecords: MealRecord[];
  onRecordMeal: (type: string, calories: number) => void;
}

const MealTracker: React.FC<MealTrackerProps> = ({ mealRecords, onRecordMeal }) => {
  const [newMeal, setNewMeal] = useState({
    type: 'lunch',
    calories: 0,
  });

  const today = new Date().toISOString().split('T')[0];
  const todayMeals = mealRecords.filter(record => record.date === today);
  const totalCaloriesToday = todayMeals.reduce((sum, meal) => sum + meal.calories, 0);

  const handleRecordMeal = () => {
    onRecordMeal(newMeal.type, newMeal.calories);
    setNewMeal({ type: 'lunch', calories: 0 });
  };

  const getMealIcon = (type: string) => {
    switch (type) {
      case 'breakfast': return '🥞';
      case 'lunch': return '🍲';
      case 'dinner': return '🍽️';
      case 'snack': return '🍎';
      default: return '🍴';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-4"
    >
      <div>
        <h3 className="text-lg font-semibold text-card-foreground">Meal Tracker</h3>
        <p className="text-sm text-muted-foreground">Track your daily meals and calorie intake</p>
      </div>

      {/* Today's Summary */}
      <Card className="border-border bg-gradient-to-br from-card to-card/80">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <FiCoffee className="w-5 h-5" />
            Today's Nutrition
          </CardTitle>
          <CardDescription>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 rounded-lg bg-muted">
              <div className="text-sm text-muted-foreground">Meals Today</div>
              <div className="text-2xl font-bold text-card-foreground">
                {todayMeals.length}
              </div>
            </div>
            
            <div className="text-center p-4 rounded-lg bg-muted">
              <div className="text-sm text-muted-foreground">Calories</div>
              <div className="text-2xl font-bold text-card-foreground">
                {totalCaloriesToday}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Record New Meal */}
      <Dialog>
        <DialogTrigger asChild>
          <Button className="w-full flex items-center gap-2">
            <FiPlus className="w-4 h-4" />
            Record Meal
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record New Meal</DialogTitle>
            <DialogDescription>Log your meal to track nutrition intake</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Meal Type</label>
              <Select 
                value={newMeal.type} 
                onValueChange={(value) => setNewMeal({...newMeal, type: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select meal type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="breakfast">Breakfast</SelectItem>
                  <SelectItem value="lunch">Lunch</SelectItem>
                  <SelectItem value="dinner">Dinner</SelectItem>
                  <SelectItem value="snack">Snack</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium">Calories</label>
              <Input 
                type="number" 
                value={newMeal.calories} 
                onChange={(e) => setNewMeal({...newMeal, calories: parseInt(e.target.value) || 0})} 
                placeholder="Enter calories"
              />
            </div>
            
            <Button onClick={handleRecordMeal} className="w-full">
              Record Meal
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Today's Meals */}
      <div>
        <h4 className="text-md font-medium text-card-foreground mb-3">Today's Meals</h4>
        <div className="space-y-2">
          {todayMeals.length > 0 ? (
            todayMeals.map((meal, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="border-border">
                  <CardContent className="p-3 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{getMealIcon(meal.type)}</span>
                      <div>
                        <div className="text-sm font-medium capitalize">
                          {meal.type}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {meal.time}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-sm font-medium">
                      {meal.calories} cal
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              No meals recorded today
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default MealTracker;