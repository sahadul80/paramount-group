import { Employee } from '@/types/transport';

interface WelcomeBannerProps {
  user: Employee;
}

export default function WelcomeBanner({ user }: WelcomeBannerProps) {
  return (
    <div className="rounded-xl p-2 shadow-xl">
      <div className="flex flex-col sm:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-2">
            Welcome, {`${user.firstName || ''} ${user.lastName || ''}`.trim()}!
          </h2>
          <p className="opacity-90">
            {user.position} • {user.department}
          </p>
        </div>
        <div className="m-2 sm:m-4 flex items-center space-x-4">
          <div className="text-right">
            <p className="text-sm">Today's Distance</p>
            <p className="text-2xl font-bold">{user.totalDistance?.day || 0} km</p>
          </div>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center backdrop-blur-sm">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}