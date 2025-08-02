"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useToast } from "../components/ui/use-toast";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [redirectPath, setRedirectPath] = useState<string>("");
  const [showSuccess, setShowSuccess] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const logAccess = async () => {
      try {
        const response = await fetch('/api/log-access?page=login');
        const result = await response.json();
        console.log('Access logged:', result.loggedData);
      } catch (error) {
        console.error('Error logging access:', error);
      }
    };
    logAccess();
  }, []);

  // Handle browser back button
  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    if (token && role) {
      router.push(role);
    } else {
      const handleBackButton = (event: PopStateEvent) => {
        event.preventDefault();
        router.push('/');
      };
  
      window.history.pushState(null, '', window.location.href);
      window.addEventListener('popstate', handleBackButton);
  
      return () => {
        window.removeEventListener('popstate', handleBackButton);
      };
    }
  }, [router]);

  // Handle redirect after successful action
  useEffect(() => {
    if (redirectPath) {
      const timer = setTimeout(() => {
        router.push(redirectPath);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [redirectPath, router]);

  async function handleLogin(event: React.FormEvent) {
    event.preventDefault();
    if (!username || !password) {
      setError("Please fill in all fields");
      toast({
        title: "Validation Error",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/user/login", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", data.username);
        localStorage.setItem("role", data.role);
        
        toast({
          title: "Login Successful!",
          description: "Redirecting to your dashboard...",
        });
        fetch('/api/user/update-status', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ 
            username: data.username, 
            status: 5
          })
        });
        // Show success animation first
        setShowSuccess(true);
        // Set redirect after animation completes
        setTimeout(() => {
          setRedirectPath(data.role);
        }, 500);
      } else {
        throw new Error(data.message || "Login failed");
      }
    } catch (err: any) {
      const errorMsg = err.message || "An unexpected error occurred";
      setError(errorMsg);
      toast({
        title: "Login Failed",
        description: errorMsg,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  async function handleRegister() {
    router.push("/register");
  }

  // Optimized animation variants
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.05,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { y: 10, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { 
        duration: 0.25,
        ease: "easeOut"
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-muted px-4 dark:bg-background relative">
      {/* Full Screen Loader - Now non-blocking */}
      <AnimatePresence>
        {isLoading && !showSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center"
          >
            <motion.div
              animate={{ 
                rotate: 360,
                transition: { 
                  rotate: { 
                    duration: 1, 
                    repeat: Infinity, 
                    ease: "linear" 
                  } 
                }
              }}
              className="text-primary"
            >
              <Loader2 className="h-16 w-16" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="w-full max-w-md bg-card text-card-foreground rounded-xl shadow-lg z-10 overflow-hidden"
      >
        <div className="p-8">
          <motion.div 
            className="text-center mb-8"
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <div className="mx-auto bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mb-4">
              <div className="bg-primary text-primary-foreground rounded-full w-12 h-12 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
                </svg>
              </div>
            </div>
            <h1 className="text-xl md:text-2xl font-bold">LogIn</h1>
            <p className="text-sm text-muted-foreground mt-2">
              Welcome! Sign in to continue
            </p>
          </motion.div>

          <AnimatePresence mode="wait">
            {showSuccess ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="text-center py-8"
              >
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center text-green-500"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </motion.div>
                <motion.p 
                  className="text-lg font-medium"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, ease: "easeOut", delay: 0.1 }}
                >
                  Login successful!
                </motion.p>
                <motion.p
                  className="text-muted-foreground mt-2"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, ease: "easeOut", delay: 0.2 }}
                >
                  Redirecting to your dashboard...
                </motion.p>
              </motion.div>
            ) : !redirectPath ? (
              <motion.form
                key="form"
                onSubmit={handleLogin}
                className="space-y-4"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0 }}
              >
                <motion.div variants={itemVariants}>
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase())}
                    className="w-full h-10 rounded-lg border border-input bg-background p-3 text-sm focus:ring-2 focus:ring-ring focus:outline-none" 
                    placeholder="Username"
                    disabled={isLoading}
                  />
                </motion.div>

                <motion.div className="relative" variants={itemVariants}>
                  <input
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    type={showPassword ? "text" : "password"}
                    className="w-full h-10 rounded-lg border border-input bg-background p-3 pr-10 text-sm focus:ring-2 focus:ring-ring focus:outline-none"
                    placeholder="Enter password"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOpenIcon />
                    ) : (
                      <EyeClosedIcon />
                    )}
                  </button>
                </motion.div>

                {error && (
                  <motion.div 
                    className="text-red-500 text-sm text-center py-2"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    transition={{ duration: 0.2 }}
                  >
                    {error}
                  </motion.div>
                )}

                <motion.div 
                  className="flex items-center justify-between text-sm pt-2"
                  variants={itemVariants}
                >
                  <a href="#" className="text-muted-foreground hover:underline text-sm">
                    Forgot Password?
                  </a>
                  <motion.button
                    type="submit"
                    disabled={isLoading}
                    className="px-4 py-2 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    Sign In
                  </motion.button>
                </motion.div>

                <motion.div 
                  className="flex justify-center pt-4 text-sm text-muted-foreground gap-2"
                  variants={itemVariants}
                >
                  Don't have an account?
                  <button
                    type="button"
                    onClick={handleRegister}
                    disabled={isLoading}
                    className="text-indigo-600 hover:underline font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Register
                  </button>
                </motion.div>
              </motion.form>
            ) : null}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Background elements with reduced blur for better performance */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-20 left-10 w-40 h-40 bg-primary/10 rounded-full blur-xl"></div>
        <div className="absolute bottom-20 right-10 w-32 h-32 bg-secondary/10 rounded-full blur-xl"></div>
      </div>
    </div>
  );
}

// Eye icons
function EyeOpenIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" viewBox="0 0 512 512" className="fill-current">
      <title>eye-glyph</title>
      <path d="M320,256a64,64,0,1,1-64-64A64.07,64.07,0,0,1,320,256Zm189.81,9.42C460.86,364.89,363.6,426.67,256,426.67S51.14,364.89,2.19,265.42a21.33,21.33,0,0,1,0-18.83C51.14,147.11,148.4,85.33,256,85.33s204.86,61.78,253.81,161.25A21.33,21.33,0,0,1,509.81,265.42ZM362.67,256A106.67,106.67,0,1,0,256,362.67,106.79,106.79,0,0,0,362.67,256Z" />
    </svg>
  );
}

function EyeClosedIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" viewBox="0 0 512 512" className="fill-current">
      <title>eye-disabled-glyph</title>
      <path d="M409.84,132.33l95.91-95.91A21.33,21.33,0,1,0,475.58,6.25L6.25,475.58a21.33,21.33,0,1,0,30.17,30.17L140.77,401.4A275.84,275.84,0,0,0,256,426.67c107.6,0,204.85-61.78,253.81-161.25a21.33,21.33,0,0,0,0-18.83A291,291,0,0,0,409.84,132.33ZM256,362.67a105.78,105.78,0,0,1-58.7-17.8l31.21-31.21A63.29,63.29,0,0,0,256,320a64.07,64.07,0,0,0,64-64,63.28,63.28,0,0,0-6.34-27.49l31.21-31.21A106.45,106.45,0,0,1,256,362.67ZM2.19,265.42a21.33,21.33,0,0,1,0-18.83C51.15,147.11,148.4,85.33,256,85.33a277,277,0,0,1,70.4,9.22l-55.88,55.88A105.9,105.9,0,0,0,150.44,270.52L67.88,353.08A295.2,295.2,0,0,1,2.19,265.42Z" />
    </svg>
  );
}