"use client";
import { useState } from "react";
import { Button } from "react-day-picker";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Input } from "../ui/input";
import { User } from "@/types/users";

interface Props {
  user: User;
  onClose: () => void;
}

export default function EditUser({ user, onClose }: Props) {
  const [formData, setFormData] = useState<User>(user);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    console.log("Updated user data:", formData);
    onClose();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
        </DialogHeader>
        <Input name="position" value={formData.position} onChange={handleChange} className="mb-2" placeholder="Position" />
        <Input name="salary" type="number" value={formData.salary?.toString() ?? ""} onChange={handleChange} className="mb-2" placeholder="Salary" />
        <Input name="department" value={formData.department ?? ""} onChange={handleChange} className="mb-2" placeholder="Department" />
        <Input name="employeeId" value={formData.employeeId ?? ""} onChange={handleChange} className="mb-2" placeholder="Employee ID" />
        <Button onClick={handleSubmit} className="w-full">Save</Button>
      </DialogContent>
    </Dialog>
  );
}