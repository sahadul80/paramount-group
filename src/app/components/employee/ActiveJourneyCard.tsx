import { useState } from 'react';
import { Journey, DriverDetails, Car } from '@/types/transport';

interface ActiveJourneyCardProps {
  journey: Journey;
  driverDetails?: DriverDetails;
  car?: Car;
  onRouteChange: (newStop: string) => Promise<void>;
  onDropoff: () => Promise<void>;
  onCallDriver: (phoneNumber: string) => void;
  isRequestingRouteChange?: boolean;
  isRequestingDropoff?: boolean;
}

export default function ActiveJourneyCard({
  journey,
  driverDetails,
  car,
  onRouteChange,
  onDropoff,
  onCallDriver,
  isRequestingRouteChange = false,
  isRequestingDropoff = false,
}: ActiveJourneyCardProps) {
  const [showDriverDetails, setShowDriverDetails] = useState(true);
  const [newStop, setNewStop] = useState('');

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="col-span-full space-y-6">
      <div className="rounded-2xl p-6 shadow-lg border border-slate-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-accent">Active Journey</h3>
            <p className="text-tartiary text-sm">To: {journey.endLocation.address}</p>
          </div>
          <div className="flex items-center space-x-3 mt-2 sm:mt-0">
            <span className="px-3 py-1 text-accent text-sm font-medium rounded-full animate-pulse">
              Live • ETA: {journey.estimatedDuration} minutes
            </span>
            {driverDetails && (
              <button
                onClick={() => setShowDriverDetails(!showDriverDetails)}
                className="px-3 py-1 text-primary text-sm font-medium rounded-lg hover:bg-slate-100 transition-colors"
              >
                {showDriverDetails ? 'Hide Details' : 'Driver Info'}
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm text-tartiary">Pickup Location</p>
                <p className="font-medium text-accent">{journey.startLocation.address}</p>
                <p className="text-xs text-tartiary">Started at {formatTime(journey.startTime)}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm text-tartiary">Destination</p>
                <p className="font-medium text-accent">{journey.endLocation.address}</p>
                <p className="text-xs text-tartiary">Estimated arrival: {journey.estimatedDuration} minutes</p>
              </div>
            </div>

            {/* Add Stop Form */}
            <div className="border-t border-slate-200 pt-4">
              <label className="block text-sm font-medium text-tartiary mb-2">Add a stop</label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newStop}
                  onChange={(e) => setNewStop(e.target.value)}
                  placeholder="Enter stop location..."
                  className="flex-1 p-2 border border-slate-300 rounded-lg"
                />
                <button
                  onClick={() => {
                    if (newStop.trim()) {
                      onRouteChange(newStop);
                      setNewStop('');
                    }
                  }}
                  disabled={isRequestingRouteChange || !newStop.trim()}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50"
                >
                  {isRequestingRouteChange ? 'Adding...' : 'Add'}
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm text-tartiary">Distance</p>
                <p className="font-medium text-accent">{journey.distance} km</p>
                <p className="text-xs text-tartiary">Total estimated journey</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm text-tartiary">Duration</p>
                <p className="font-medium text-accent">{journey.estimatedDuration} minutes</p>
                <p className="text-xs text-tartiary">Total estimated time</p>
              </div>
            </div>

            <button
              onClick={onDropoff}
              disabled={isRequestingDropoff}
              className="w-full mt-4 p-3 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>{isRequestingDropoff ? 'Requesting...' : 'Emergency Drop-off'}</span>
            </button>
          </div>
        </div>
      </div>

      {showDriverDetails && driverDetails && car && (
        <div className="rounded-2xl p-6 shadow-lg border border-slate-100">
          <h3 className="text-lg font-semibold text-accent mb-6 flex items-center">
            <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Driver & Vehicle Details
          </h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-2xl font-bold text-blue-600">
                    {driverDetails.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <h4 className="text-xl font-bold text-accent">{driverDetails.name}</h4>
                  <p className="text-tartiary">
                    Age: {driverDetails.age} • {driverDetails.experience} experience
                  </p>
                  <div className="flex items-center mt-1">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className={i < Math.floor(driverDetails.rating) ? 'text-yellow-400' : 'text-gray-300'}>
                        ⭐
                      </span>
                    ))}
                    <span className="ml-2 text-sm text-tartiary">
                      {driverDetails.rating} ({driverDetails.totalTrips} trips)
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-tartiary">Contact Number</p>
                    <p className="font-medium text-accent">{driverDetails.contactNumber}</p>
                  </div>
                </div>
              </div>
              
              <button
                onClick={() => onCallDriver(driverDetails.contactNumber)}
                className="w-full bg-blue-600 p-3 rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span className="font-medium text-white">Call Driver</span>
              </button>
            </div>

            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-xl font-bold text-accent">{car.model}</h4>
                  <p className="text-tartiary">Registration: {car.regNo}</p>
                  <p className="text-tartiary">Color: {car.color || 'White'}</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center">
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-tartiary">Current Location</p>
                    <p className="font-medium text-accent">En route to pickup location</p>
                  </div>
                </div>
              </div>
              
              <div className="pt-4 border-t border-slate-200">
                <p className="text-sm text-tartiary mb-3">
                  <span className="font-medium">Safety Check:</span> Driver and vehicle verified by FleetPro Admin
                </p>
                <div className="flex space-x-2">
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">Verified Driver</span>
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">Company Vehicle</span>
                  <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">GPS Tracked</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}