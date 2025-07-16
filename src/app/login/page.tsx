"use client";

import { useState, useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [redirectPath, setRedirectPath] = useState<string>("");
  const router = useRouter();

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
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [redirectPath, router]);

  async function handleLogin(event: React.FormEvent) {
    event.preventDefault();
    if (!username || !password) {
      setError("Please fill in all fields");
      toast.error("Please fill in all fields");
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
        localStorage.setItem("role", data.role); // Store role
        
        toast.success("Login successful!");
        
        // Redirect based on role
        setRedirectPath(data.role);
      } else {
        throw new Error(data.message || "Login failed");
      }
    } catch (err: any) {
      const errorMsg = err.message || "An unexpected error occurred";
      setError(errorMsg);
      toast.error(errorMsg);
      setIsLoading(false);
    }
  };

  async function handleRegister() {
    router.push("/register");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground px-4 dark:bg-background dark:text-foreground relative">
      <Toaster />
      <div className="w-full max-w-md bg-card text-card-foreground p-8 rounded-xl shadow-lg z-10 dark:bg-card dark:text-card-foreground">
        <div className="text-center mb-6">
          <h1 className="text-xl md:text-3xl font-bold">LogIn</h1>
          <p className="text-xs sm:text-sm text-muted-foreground italic">
            Welcome! Sign in to continue.
          </p>
        </div>

        {!redirectPath ? (
          <form onSubmit={handleLogin} className="space-y-2 md:space-y-4">
            <div>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase())}
                className="w-full h-8 sm:h-10 rounded-md border border-border bg-input p-3 text-sm focus:ring-2 focus:ring-ring focus:outline-none" 
                placeholder="Username"
                disabled={isLoading}
              />
            </div>

            <div className="relative">
              <input
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type={showPassword ? "text" : "password"}
                className="w-full h-8 sm:h-10 rounded-md border border-border bg-input p-3 text-sm focus:ring-2 focus:ring-ring focus:outline-none"
                placeholder="Enter password"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground dark:text-muted-foreground dark:hover:text-foreground"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOpenIcon />
                ) : (
                  <EyeClosedIcon />
                )}
              </button>
            </div>

            {error && (
              <div className="text-red-500 text-sm text-center">
                {error}
              </div>
            )}

            <div className="flex items-center justify-between text-sm p-4">
              <a href="#" className="text-muted-foreground hover:underline">
                Forgot Password?
              </a>
              <button
                type="submit"
                disabled={isLoading}
                className="w-auto text-blue-600 font-bold p-2 rounded-md border border-border hover:bg-blue-600/20 dark:hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Signing In..." : "Sign In"}
              </button>
            </div>

            <div className="flex justify-center p-4 text-sm text-muted-foreground gap-3">
              Don't have an account?
              <button
                type="button"
                onClick={handleRegister}
                disabled={isLoading}
                className="underline text-indigo-600 hover:cursor-pointer hover:bg-indigo-600/20 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Register
              </button>
            </div>
          </form>
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center text-green-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="text-lg font-medium">
              Login successful! Redirecting to your dashboard...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// Eye icons remain the same as before
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