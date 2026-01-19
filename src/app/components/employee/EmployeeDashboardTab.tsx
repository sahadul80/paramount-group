import { Employee, Journey, Car } from '@/types/transport';
import WelcomeBanner from './WelcomeBanner';
import ActiveJourneyCard from './ActiveJourneyCard';
import toast from 'react-hot-toast';
import QuickActions from './QuickActions';
import StatsOverview from './StatsOverview';

interface EmployeeDashboardTabProps {
  user: Employee;
  journeys: Journey[];
  cars: Car[];
  onAction: (action: string) => void;
}

export default function EmployeeDashboardTab({
  user,
  journeys,
  cars,
  onAction
}: EmployeeDashboardTabProps) {
  const activeJourney = journeys.find(j => j.status === 'in-progress');
  const completedJourneys = journeys.filter(j => j.status === 'completed');
  const lastJourney = journeys
    .filter(j => j.status === 'completed')
    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())[0];

  return (
    <div className="space-y-6">
      <WelcomeBanner user={user} />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {activeJourney && (
            <ActiveJourneyCard 
                journey={activeJourney}
                onRouteChange={async () => onAction('route-change')}
                onDropoff={async () => onAction('dropoff')} onCallDriver={function (phoneNumber: string): void {
                    toast.error('Function not implemented.');
                }}
            />
        )}
        
        {!activeJourney && lastJourney && (
          <div className="rounded-2xl p-6 shadow-lg border border-slate-100">
            <h3 className="text-lg font-semibold text-accent mb-6">Last Journey</h3>
            {/* Last journey details */}
          </div>
        )}
      </div>

      <QuickActions onAction={onAction} />
      <StatsOverview 
        totalDistance={user.totalDistance ? user.totalDistance : {day: 0, month: 0, year: 0}}
        completedJourneys={completedJourneys.length}
        assignedCars={cars.length}
      />
    </div>
  );
}