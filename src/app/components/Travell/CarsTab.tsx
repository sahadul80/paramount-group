import { Car } from '@/types/transport';

interface CarsTabProps {
  cars: Car[];
}

export default function CarsTab({ cars }: CarsTabProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'in-use':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-red-100 text-red-800';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {cars.length === 0 ? (
        <div className="col-span-full p-8 text-center text-tartiary">
          No cars assigned to you.
        </div>
      ) : (
        cars.map((car) => (
          <div
            key={car.id}
            className="p-6 rounded-2xl shadow-lg border border-slate-100 hover:shadow-xl transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-accent">{car.model}</h4>
              <span className={`px-2 py-1 text-xs rounded-full font-medium ${getStatusColor(car.status)}`}>
                {car.status}
              </span>
            </div>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center p-2 border-b border-slate-100">
                <span className="text-tartiary">Registration</span>
                <span className="font-medium text-accent bg-slate-100 px-2 py-1 rounded">
                  {car.regNo}
                </span>
              </div>
              
              <div className="flex justify-between items-center p-2 border-b border-slate-100">
                <span className="text-tartiary">Cleanliness</span>
                <span className={`font-medium ${car.isClean ? 'text-green-600' : 'text-red-600'}`}>
                  {car.isClean ? '✅ Clean' : '❌ Needs Cleaning'}
                </span>
              </div>
              
              <div className="flex justify-between items-center p-2 border-b border-slate-100">
                <span className="text-tartiary">Service</span>
                <span className={`font-medium ${car.needsServicing ? 'text-red-600' : 'text-green-600'}`}>
                  {car.needsServicing ? '🔧 Needs Service' : '✅ Good'}
                </span>
              </div>
              
              <div className="flex justify-between items-center p-2">
                <span className="text-tartiary">Location</span>
                <span className="font-medium text-accent">{car.currentLocation.address}</span>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-slate-100">
              <p className="text-xs text-tartiary mb-2">Total Distance Travelled</p>
              <div className="flex justify-between text-xs">
                <span className="text-accent">Day: {car.totalDistanceTravelled.day}km</span>
                <span className="text-accent">Month: {car.totalDistanceTravelled.month}km</span>
                <span className="text-accent">Year: {car.totalDistanceTravelled.year}km</span>
              </div>
            </div>
            
            <div className="mt-4">
              <button
                onClick={() => {
                  // Handle service request
                  alert(`Service requested for ${car.regNo}`);
                }}
                disabled={!car.needsServicing}
                className={`w-full p-2 rounded-lg transition-colors ${
                  car.needsServicing
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                }`}
              >
                {car.needsServicing ? 'Request Service' : 'No Service Needed'}
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}