import { Employee } from '@/types/transport';

interface EmployeeHeaderProps {
  user: Employee | null;
  activeTab: string;
  isMobileMenuOpen: boolean;
  setActiveTab: (tab: string) => void;
  setIsMobileMenuOpen: (isOpen: boolean) => void;
}

export default function EmployeeHeader({
  user,
  activeTab,
  isMobileMenuOpen,
  setActiveTab,
  setIsMobileMenuOpen
}: EmployeeHeaderProps) {
  const tabs = [
    { id: 'dashboard', name: 'Dashboard', icon: '📊' },
    { id: 'profile', name: 'Profile', icon: '👤' },
    { id: 'travel-logs', name: 'Travel Logs', icon: '📝' },
    { id: 'cars', name: 'My Cars', icon: '🚗' },
    { id: 'book-ride', name: 'Book Ride', icon: '📍' }
  ];

  return (
    <header className="backdrop-blur-md">
      <div className="flex items-center justify-around gap-4 w-full">
        {/* User Profile & Mobile Menu Button */}
        <div className="flex flex-row items-center justify-between w-auto">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Toggle mobile menu"
          >
            <svg className="w-6 h-6 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d={isMobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} 
              />
            </svg>
          </button>
        </div>
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-medium text-sm transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-primary text-white shadow-lg shadow-blue-500/25'
                  : 'text-secondary hover:bg-gray-100 hover:shadow-md'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.name}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <div className="md:hidden p-4 border-t border-slate-200 backdrop-blur-md bg-white/95 rounded-b-2xl shadow-lg">
          <nav className="flex flex-col space-y-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setIsMobileMenuOpen(false);
                }}
                className={`flex items-center space-x-3 p-4 rounded-xl font-medium text-sm transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-primary text-white shadow-lg shadow-blue-500/25'
                    : 'text-secondary hover:bg-gray-100'
                }`}
              >
                <span className="text-lg">{tab.icon}</span>
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}