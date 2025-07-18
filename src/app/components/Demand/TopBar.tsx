import { LogOut } from "lucide-react";
import { Button } from "../ui/button";
import { useRouter } from "next/navigation";

export default function TopBar() {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    router.push("/login");
  };

  return (
    <div className="sticky top-0 z-10 bg-gray-50 dark:bg-gray-900 py-3 px-2 sm:px-4 flex justify-between items-center mb-2 sm:mb-4 border-b">
      <h1 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white">
        Demand Form
      </h1>
      <Button
        onClick={handleLogout}
        variant="ghost"
        size="sm"
        className="text-red-500 hover:bg-red-500/10 flex items-center gap-1 py-1 px-2"
      >
        <LogOut className="h-3 w-3 sm:h-4 sm:w-4" />
        <span className="hidden sm:inline">Logout</span>
      </Button>
    </div>
  );
}