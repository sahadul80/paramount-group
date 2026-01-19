"use client";

import { useState, useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";
import { useRouter } from "next/navigation";
import { Button } from "../components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { FiEye, FiEyeOff, FiUser, FiMail, FiKey, FiCheckCircle, FiArrowLeft, FiBriefcase, FiAlertCircle } from "react-icons/fi";

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
  const [existingUsernames, setExistingUsernames] = useState<string[]>([]);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameSuggestion, setUsernameSuggestion] = useState("");
  const router = useRouter();

  // Fetch existing usernames on component mount
  useEffect(() => {
    const fetchExistingUsernames = async () => {
      try {
        const res = await fetch("/api/user/all");
        const data = await res.json();
        
        if (res.ok && Array.isArray(data)) {
          const usernames = data.map(user => user.username).filter(Boolean);
          setExistingUsernames(usernames);
        }
      } catch (error) {
        console.error("Failed to fetch existing usernames:", error);
      }
    };

    fetchExistingUsernames();
  }, []);

  // Check username availability with debounce
  useEffect(() => {
    const checkUsernameAvailability = async () => {
      if (!formData.username || formData.username.length < 3) {
        setUsernameSuggestion("");
        return;
      }

      if (errors.username?.includes("must be at least 3") || errors.username?.includes("Only lowercase letters")) {
        return;
      }

      setIsCheckingUsername(true);

      // Simulate API delay for better UX
      await new Promise(resolve => setTimeout(resolve, 300));

      const usernameExists = existingUsernames.includes(formData.username.toLowerCase());

      if (usernameExists) {
        // Generate username suggestions
        const suggestions = generateUsernameSuggestions(formData.username, existingUsernames);
        setUsernameSuggestion(suggestions[0] || "");
        
        setErrors(prev => ({
          ...prev,
          username: `Username already taken. Try: ${suggestions.slice(0, 3).join(', ')}`
        }));
      } else {
        setUsernameSuggestion("");
        setErrors(prev => {
          const newErrors = { ...prev };
          if (newErrors.username?.includes("already taken")) {
            delete newErrors.username;
          }
          return newErrors;
        });
      }

      setIsCheckingUsername(false);
    };

    const timeoutId = setTimeout(checkUsernameAvailability, 500);
    return () => clearTimeout(timeoutId);
  }, [formData.username, existingUsernames]);

  const generateUsernameSuggestions = (baseUsername: string, existingUsernames: string[]): string[] => {
    const suggestions: string[] = [];
    const cleanUsername = baseUsername.toLowerCase().replace(/[^a-z0-9_]/g, '');
    
    // Add numbers
    for (let i = 1; i <= 5; i++) {
      const suggestion = `${cleanUsername}${i}`;
      if (!existingUsernames.includes(suggestion)) {
        suggestions.push(suggestion);
      }
    }
    
    // Add underscore with numbers
    for (let i = 1; i <= 3; i++) {
      const suggestion = `${cleanUsername}_${i}`;
      if (!existingUsernames.includes(suggestion)) {
        suggestions.push(suggestion);
      }
    }
    
    // Add "real" if none of the above work
    if (suggestions.length === 0) {
      suggestions.push(`${cleanUsername}_real`);
    }
    
    return suggestions.slice(0, 5); // Return max 5 suggestions
  };

  const validateField = (name: string, value: string) => {
    let newErrors = { ...errors };
    
    switch (name) {
      case "username":
        if (!value) {
          newErrors.username = "Username is required";
          setUsernameSuggestion("");
        } else if (value.length < 3) {
          newErrors.username = "Username must be at least 3 characters";
          setUsernameSuggestion("");
        } else if (!/^[a-z0-9_]+$/.test(value)) {
          newErrors.username = "Only lowercase letters, numbers and underscores";
          setUsernameSuggestion("");
        } else if (existingUsernames.includes(value.toLowerCase())) {
          // This will be handled by the useEffect
          // Don't set error here to avoid double-setting
        } else {
          delete newErrors.username;
          setUsernameSuggestion("");
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
    const processedValue = name === "username" ? value.toLowerCase() : value;
    setFormData(prev => ({ ...prev, [name]: processedValue }));
    
    // Don't validate username here - let the useEffect handle it
    if (name !== "username") {
      validateField(name, processedValue);
    }
  };

  const handleUseSuggestion = () => {
    if (usernameSuggestion) {
      setFormData(prev => ({ ...prev, username: usernameSuggestion }));
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.username;
        return newErrors;
      });
      setUsernameSuggestion("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Final validation
    const fieldsToValidate = ["email", "role", "password", "confirmPassword"];
    if (!errors.username) {
      fieldsToValidate.push("username");
    }
    
    const isValid = fieldsToValidate.every(name => 
      validateField(name, formData[name as keyof typeof formData])
    );
    
    if (Object.keys(errors).length > 0 || !isValid) {
      toast.error("Please fix the errors in the form");
      return;
    }

    // Double-check username availability
    if (existingUsernames.includes(formData.username.toLowerCase())) {
      toast.error("Username is already taken. Please choose another one.");
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
                  {isCheckingUsername && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                    </div>
                  )}
                </div>
                {errors.username && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    className="text-red-500 text-xs mt-1 pl-2"
                  >
                    <div className="flex items-start">
                      <FiAlertCircle className="mr-1 mt-0.5 flex-shrink-0" />
                      <span>{errors.username}</span>
                    </div>
                  </motion.div>
                )}
                {usernameSuggestion && !errors.username && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    className="text-green-600 text-xs mt-1 pl-2 flex items-center"
                  >
                    <FiCheckCircle className="mr-1" />
                    Username is available!
                  </motion.div>
                )}
                {usernameSuggestion && errors.username?.includes("already taken") && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    className="mt-2"
                  >
                    <div className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                      Suggested username:
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-md px-3 py-2 text-sm font-medium">
                        {usernameSuggestion}
                      </div>
                      <button
                        type="button"
                        onClick={handleUseSuggestion}
                        className="px-3 py-2 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700 transition-colors"
                      >
                        Use This
                      </button>
                    </div>
                  </motion.div>
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
                disabled={isLoading || Object.keys(errors).length > 0 || isCheckingUsername}
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