"use client";

import { useState, useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";
import { useRouter } from "next/navigation";
import { Button } from "../components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { FiEye, FiEyeOff, FiUser, FiMail, FiKey, FiCheckCircle, FiArrowLeft, FiBriefcase } from "react-icons/fi";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    role: "",
    password: "",
    confirmPassword: ""
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const validateField = (name: string, value: string) => {
    let newErrors = { ...errors };
    
    switch (name) {
      case "username":
        if (!value) {
          newErrors.username = "Username is required";
        } else if (value.length < 3) {
          newErrors.username = "Username must be at least 3 characters";
        } else if (!/^[a-z0-9_]+$/.test(value)) {
          newErrors.username = "Only lowercase letters, numbers and underscores";
        } else {
          delete newErrors.username;
        }
        break;
        
      case "email":
        if (!value) {
          newErrors.email = "Email is required";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          newErrors.email = "Invalid email format";
        } else {
          delete newErrors.email;
        }
        break;
        
      case "role":
        if (!value) {
          newErrors.role = "Please select a role";
        } else {
          delete newErrors.role;
        }
        break;
        
      case "password":
        if (!value) {
          newErrors.password = "Password is required";
        } else if (value.length < 8) {
          newErrors.password = "Password must be at least 8 characters";
        } else if (!/[A-Z]/.test(value)) {
          newErrors.password = "Must contain an uppercase letter";
        } else if (!/[0-9]/.test(value)) {
          newErrors.password = "Must contain a number";
        } else {
          delete newErrors.password;
          
          // Validate confirm password if password changes
          if (formData.confirmPassword && value !== formData.confirmPassword) {
            newErrors.confirmPassword = "Passwords do not match";
          } else if (formData.confirmPassword) {
            delete newErrors.confirmPassword;
          }
        }
        break;
        
      case "confirmPassword":
        if (!value) {
          newErrors.confirmPassword = "Please confirm your password";
        } else if (value !== formData.password) {
          newErrors.confirmPassword = "Passwords do not match";
        } else {
          delete newErrors.confirmPassword;
        }
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name === "username" ? value.toLowerCase() : value }));
    validateField(name, value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields
    const isValid = Object.entries(formData).every(([name, value]) => 
      validateField(name, value)
    );
    
    if (!isValid) {
      toast.error("Please fix the errors in the form");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/user/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, status }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Registration failed");
      }

      toast.success("User created successfully!");
      setSuccess(true);
      
      // Redirect after success animation
      setTimeout(() => router.push("/login"), 2000);
    } catch (err: any) {
      const errorMsg = err.message || "An unexpected error occurred";
      toast.error(errorMsg);
      setIsLoading(false);
    }
  };

  const handleLogin = () => {
    router.push("/login");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-100 px-4 dark:bg-gradient-to-br dark:from-gray-900 dark:to-indigo-900">
      <Toaster position="top-center" />
      
      <AnimatePresence>
        {success ? (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center p-8 bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full"
          >
            <motion.div
              animate={{ 
                rotate: 0,
                scale: [1, 1.2, 1],
              }}
              transition={{ duration: 0.5 }}
              className="inline-block mb-6"
            >
              <FiCheckCircle className="text-green-500 w-16 h-16 mx-auto" />
            </motion.div>
            
            <motion.h2 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-2xl font-bold mb-2"
            >
              Registration Successful!
            </motion.h2>
            
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-gray-600 dark:text-gray-300 mb-6"
            >
              Your account has been created and is pending verification. 
              You'll receive an email once your account is approved.
            </motion.p>
            
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden mt-4">
                <motion.div 
                  className="h-full bg-green-500"
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 2, ease: "linear" }}
                />
              </div>
              <p className="text-sm text-gray-500 mt-2">Redirecting to login...</p>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full max-w-md bg-white dark:bg-gray-800 text-foreground p-6 sm:p-8 rounded-xl shadow-lg z-10"
          >
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-center mb-6"
            >
              <div className="bg-indigo-100 dark:bg-indigo-900/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiUser className="text-indigo-600 dark:text-indigo-400 w-8 h-8" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold mb-1">Create Account</h1>
              <p className="text-sm text-muted-foreground">
                Fill in the details to create your account
              </p>
            </motion.div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <div className="relative">
                  <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    name="username"
                    type="text"
                    placeholder="Username"
                    value={formData.username}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-3 h-10 rounded-md border ${
                      errors.username ? "border-red-500" : "border-gray-300"
                    } bg-input text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none`}
                    disabled={isLoading}
                  />
                </div>
                {errors.username && (
                  <motion.p 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    className="text-red-500 text-xs mt-1 pl-2"
                  >
                    {errors.username}
                  </motion.p>
                )}
              </div>

              <div>
                <div className="relative">
                  <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    name="email"
                    type="email"
                    placeholder="Email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-3 h-10 rounded-md border ${
                      errors.email ? "border-red-500" : "border-gray-300"
                    } bg-input text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none`}
                    disabled={isLoading}
                  />
                </div>
                {errors.email && (
                  <motion.p 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    className="text-red-500 text-xs mt-1 pl-2"
                  >
                    {errors.email}
                  </motion.p>
                )}
              </div>

              <div>
                <div className="relative">
                  <FiBriefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <select 
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-3 h-10 rounded-md border ${
                      errors.role ? "border-red-500" : "border-gray-300"
                    } bg-input text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none appearance-none`}
                    disabled={isLoading}
                  >
                    <option value="">Select Role</option>
                    <option value="employee">Employee</option>
                    <option value="erp">ERP & Admin</option>
                    <option value="admin">HRM & Admin</option>
                    <option value="demand">Demand Entry</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                      <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                    </svg>
                  </div>
                </div>
                {errors.role && (
                  <motion.p 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    className="text-red-500 text-xs mt-1 pl-2"
                  >
                    {errors.role}
                  </motion.p>
                )}
              </div>

              <div>
                <div className="relative">
                  <FiKey className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={formData.password}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-10 h-10 rounded-md border ${
                      errors.password ? "border-red-500" : "border-gray-300"
                    } bg-input text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none`}
                    disabled={isLoading}
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)} 
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-600" 
                    tabIndex={-1}
                  >
                    {showPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
                {errors.password && (
                  <motion.p 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    className="text-red-500 text-xs mt-1 pl-2"
                  >
                    {errors.password}
                  </motion.p>
                )}
              </div>

              <div>
                <div className="relative">
                  <FiKey className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    name="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="Confirm Password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-10 h-10 rounded-md border ${
                      errors.confirmPassword ? "border-red-500" : "border-gray-300"
                    } bg-input text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none`}
                    disabled={isLoading}
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)} 
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-600" 
                    tabIndex={-1}
                  >
                    {showPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <motion.p 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    className="text-red-500 text-xs mt-1 pl-2"
                  >
                    {errors.confirmPassword}
                  </motion.p>
                )}
              </div>
              <Button
                type="submit"
                disabled={isLoading || Object.keys(errors).length > 0}
                className={`w-full h-10 rounded-md font-bold transition-none ${
                  isLoading 
                    ? "bg-indigo-400" 
                    : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                } text-white shadow-lg disabled:opacity-70 disabled:cursor-not-allowed`}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Creating Account...
                  </div>
                ) : (
                  "Create Account"
                )}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <button
                type="button"
                onClick={handleLogin}
                disabled={isLoading}
                className="font-medium text-indigo-600 hover:text-indigo-800 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center justify-center">
                  <FiArrowLeft className="mr-1" />
                  Back to Login
                </div>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Background elements */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-40 h-40 bg-indigo-200 rounded-full blur-3xl opacity-30 dark:bg-indigo-900/50"></div>
        <div className="absolute bottom-20 right-10 w-32 h-32 bg-purple-200 rounded-full blur-3xl opacity-30 dark:bg-purple-900/50"></div>
      </div>
    </div>
  );
}