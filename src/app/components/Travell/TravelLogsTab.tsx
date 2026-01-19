import { Journey } from '@/types/transport';

interface TravelLogsTabProps {
  journeys: Journey[];
}

export default function TravelLogsTab({ journeys }: TravelLogsTabProps) {
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Invalid date';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800 animate-pulse';
      case 'requested':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-red-100 text-red-800';
    }
  };

  return (
    <div className="rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
      <div className="p-6 border-b border-slate-100">
        <h3 className="text-lg font-semibold text-accent">Travel History</h3>
      </div>
      {journeys.length === 0 ? (
        <div className="p-8 text-center text-tartiary">No travel history found.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="p-2 sm:p-4 text-left text-xs font-medium text-tartiary uppercase tracking-wider">
                  Date
                </th>
                <th className="p-2 sm:p-4 text-left text-xs font-medium text-tartiary uppercase tracking-wider">
                  From → To
                </th>
                <th className="p-2 sm:p-4 text-left text-xs font-medium text-tartiary uppercase tracking-wider">
                  Distance
                </th>
                <th className="p-2 sm:p-4 text-left text-xs font-medium text-tartiary uppercase tracking-wider">
                  Status
                </th>
                <th className="p-2 sm:p-4 text-left text-xs font-medium text-tartiary uppercase tracking-wider">
                  Rating
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {journeys.map((journey) => (
                <tr key={journey.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-2 sm:p-4 whitespace-nowrap text-sm text-tartiary">
                    {formatDate(journey.startTime)}
                  </td>
                  <td className="p-2 sm:p-4 text-sm">
                    <div className="font-medium text-accent">{journey.startLocation.address}</div>
                    <div className="text-tartiary text-xs">→ {journey.endLocation.address}</div>
                  </td>
                  <td className="p-2 sm:p-4 whitespace-nowrap text-sm text-accent">
                    {journey.distance} km
                  </td>
                  <td className="p-2 sm:p-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${getStatusColor(journey.status)}`}>
                      {journey.status}
                    </span>
                  </td>
                  <td className="p-2 sm:p-4 whitespace-nowrap text-sm">
                    {journey.rating ? (
                      <div className="flex space-x-1">
                        {[...Array(5)].map((_, i) => (
                          <span key={i} className={i < journey.rating! ? 'text-yellow-400' : 'text-gray-300'}>
                            ⭐
                          </span>
                        ))}
                        <span className="ml-1 text-tartiary">({journey.rating?.toFixed(1)})</span>
                      </div>
                    ) : (
                      <span className="text-tartiary">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}