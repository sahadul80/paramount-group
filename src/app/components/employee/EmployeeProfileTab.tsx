import { useState, useEffect } from 'react';
import { Employee, Location } from '@/types/transport';
import HybridMap from '../Travell/HybridMap';


interface ProfileTabProps {
  user: Employee;
  onUpdate: (data: Partial<Employee>) => Promise<boolean>;
  currentLocation: Location;
  onUpdateLocation: (location?: Location) => Promise<void>;
}

export default function ProfileTab({
  user,
  onUpdate,
  currentLocation,
  onUpdateLocation,
}: ProfileTabProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUpdatingLocation, setIsUpdatingLocation] = useState(false);
  const [isSelectingLocation, setIsSelectingLocation] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [profileData, setProfileData] = useState({
    name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
    email: user.email || '',
    designation: user.position || '',
    department: user.department || '',
    phone: user.phone || '',
  });

  // Initialize with current location
  useEffect(() => {
    if (currentLocation) {
      setSelectedLocation(currentLocation);
    }
  }, [currentLocation]);

  const handleSave = async () => {
    setIsUpdating(true);
    const nameParts = profileData.name.split(' ');
    const success = await onUpdate({
      firstName: nameParts[0] || '',
      lastName: nameParts.slice(1).join(' ') || '',
      email: profileData.email,
      position: profileData.designation,
      department: profileData.department,
      phone: profileData.phone,
    });
    if (success) {
      setIsEditing(false);
    }
    setIsUpdating(false);
  };

  const handleUpdateLocation = async () => {
    setIsUpdatingLocation(true);
    try {
      if (selectedLocation) {
        // Update with selected location
        await onUpdateLocation(selectedLocation);
      } else {
        // Use current GPS location
        await onUpdateLocation();
      }
    } catch (error) {
      console.error('Failed to update location:', error);
    } finally {
      setIsUpdatingLocation(false);
    }
  };

  const handleMapLocationSelect = (location: Location, type: 'start' | 'destination' | 'waypoint') => {
    if (type === 'destination') {
      setSelectedLocation(location);
      setIsSelectingLocation(false);
    }
  };

  const handleUseCurrentLocation = async () => {
    setIsUpdatingLocation(true);
    try {
      // Get current position using Geolocation API
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            
            // Try to get address from coordinates
            try {
              const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
              );
              
              if (response.ok) {
                const data = await response.json();
                const address = data.display_name || `Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`;
                
                const newLocation: Location = {
                  lat: latitude,
                  lng: longitude,
                  address
                };
                
                setSelectedLocation(newLocation);
              } else {
                // Fallback to coordinates
                const newLocation: Location = {
                  lat: latitude,
                  lng: longitude,
                  address: `Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`
                };
                setSelectedLocation(newLocation);
              }
            } catch (error) {
              // Fallback to coordinates
              const newLocation: Location = {
                lat: latitude,
                lng: longitude,
                address: `Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`
              };
              setSelectedLocation(newLocation);
            }
            
            setIsUpdatingLocation(false);
          },
          (error) => {
            console.error('Error getting current location:', error);
            setIsUpdatingLocation(false);
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
          }
        );
      } else {
        console.error('Geolocation is not supported by this browser');
        setIsUpdatingLocation(false);
      }
    } catch (error) {
      console.error('Failed to get current location:', error);
      setIsUpdatingLocation(false);
    }
  };

  return (
    <div className="rounded-2xl p-6 shadow-lg border border-slate-100">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <h3 className="text-lg font-semibold text-accent">Profile Information</h3>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="bg-blue-600 text-white p-2 rounded-xl hover:bg-blue-700 transition-colors shadow-lg flex items-center space-x-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          <span>{isEditing ? 'Cancel' : 'Edit Profile'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-tartiary mb-2">Name</label>
          <input
            type="text"
            value={profileData.name}
            onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
            disabled={!isEditing}
            className="w-full p-2 sm:p-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-50 transition-colors"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-tartiary mb-2">Email</label>
          <input
            type="email"
            value={profileData.email}
            onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
            disabled={!isEditing}
            className="w-full p-2 sm:p-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-50 transition-colors"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-tartiary mb-2">Designation</label>
          <input
            type="text"
            value={profileData.designation}
            onChange={(e) => setProfileData({ ...profileData, designation: e.target.value })}
            disabled={!isEditing}
            className="w-full p-2 sm:p-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-50 transition-colors"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-tartiary mb-2">Department</label>
          <input
            type="text"
            value={profileData.department}
            onChange={(e) => setProfileData({ ...profileData, department: e.target.value })}
            disabled={!isEditing}
            className="w-full p-2 sm:p-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-50 transition-colors"
          />
        </div>
      </div>

      {/* Location Management Section */}
      <div className="mt-6 p-4 border border-slate-200 rounded-xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
          <h4 className="text-md font-semibold text-accent mb-2 sm:mb-0">Location Management</h4>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleUseCurrentLocation}
              disabled={isUpdatingLocation}
              className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center space-x-2 text-sm"
            >
              {isUpdatingLocation ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              )}
              <span>Use Current Location</span>
            </button>
            
            <button
              onClick={() => setIsSelectingLocation(!isSelectingLocation)}
              className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center space-x-2 text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              <span>{isSelectingLocation ? 'Cancel Selection' : 'Select on Map'}</span>
            </button>
          </div>
        </div>

        {/* Selected Location Display */}
        {selectedLocation && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
            <div className="flex items-center justify-between mb-2">
              <h5 className="text-sm font-medium text-blue-700">Selected Location</h5>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span className="text-xs text-blue-500">Pending Update</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-blue-600">Latitude:</span>
                <p className="font-medium">{selectedLocation.lat.toFixed(6)}</p>
              </div>
              <div>
                <span className="text-blue-600">Longitude:</span>
                <p className="font-medium">{selectedLocation.lng.toFixed(6)}</p>
              </div>
              <div className="col-span-2">
                <span className="text-blue-600">Address:</span>
                <p className="font-medium mt-1 truncate">{selectedLocation.address}</p>
              </div>
            </div>
          </div>
        )}

        {/* Map for Location Selection */}
        {isSelectingLocation && (
          <div className="mt-4 mb-4">
            <div className="mb-3">
              <h5 className="text-sm font-medium text-gray-700 mb-2">Select a location on the map:</h5>
              <p className="text-xs text-gray-500">
                Click anywhere on the map or search for a location. The selected location will be used for your next update.
              </p>
            </div>
            <div className="rounded-lg overflow-hidden border border-gray-300">
              <HybridMap
                currentLocation={currentLocation}
                onLocationSelect={handleMapLocationSelect}
                interactive={true}
                height="300px"
                showSearch={true}
                autoCalculateRoute={false}
                searchPlaceholder="Search for a location..."
                mapStyle="default"
              />
            </div>
            {selectedLocation && (
              <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-600">
                  Location selected: <span className="font-medium">{selectedLocation.address}</span>
                </p>
              </div>
            )}
          </div>
        )}

        {/* Update Location Button */}
        <div className="flex justify-end mt-4">
          <button
            onClick={handleUpdateLocation}
            disabled={isUpdatingLocation || !selectedLocation}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {isUpdatingLocation ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Updating...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Update Location</span>
              </>
            )}
          </button>
        </div>
      </div>

      {isEditing && (
        <div className="mt-6">
          <button
            onClick={handleSave}
            disabled={isUpdating}
            className="bg-blue-600 text-white p-2 sm:p-4 rounded-xl hover:bg-blue-700 transition-colors shadow-lg flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUpdating ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            )}
            <span>{isUpdating ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      )}
    </div>
  );
}