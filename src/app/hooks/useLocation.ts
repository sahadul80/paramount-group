import { useState, useCallback } from 'react';
import { Location } from '@/types/transport';
import toast from 'react-hot-toast';

export const useLocation = () => {
  const [location, setLocation] = useState<Location>({
    lat: 0,
    lng: 0,
    address: 'Location not available'
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getFallbackAddress = (lat: number, lng: number): string => {
    const addresses = [
      'Commercial Area, Downtown',
      'Business District Center',
      'Main Street Location',
      'City Center Point',
      'Urban Zone Location'
    ];
    const index = Math.abs(Math.floor(lat + lng)) % addresses.length;
    return addresses[index];
  };

  const getAddressFromCoordinates = async (lat: number, lng: number): Promise<string> => {
    try {
      // Try Nominatim API first
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16`
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.display_name) {
          return data.display_name;
        }
      }
    } catch (error) {
      console.log('Using fallback address');
    }

    return getFallbackAddress(lat, lng);
  };

  const updateLocation = useCallback(async (userId: string) => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return false;
    }

    setIsUpdating(true);
    setError(null);

    return new Promise<boolean>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            const address = await getAddressFromCoordinates(latitude, longitude);
            
            const newLocation: Location = {
              lat: latitude,
              lng: longitude,
              address
            };

            // Update in database
            const response = await fetch('/api/user/location', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                username: userId,
                location: newLocation
              }),
            });

            if (response.ok) {
              setLocation(newLocation);
              toast.success('Location updated!');
              resolve(true);
            } else {
              toast.error('Failed to update location');
            }
          } catch (err) {
            console.error('Error updating location:', err);
            setError('Failed to update location. Using local storage.');
            resolve(false);
          } finally {
            setIsUpdating(false);
          }
        },
        (error) => {
          let errorMessage = 'Unable to retrieve location. ';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage += 'Please enable location services.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage += 'Location information unavailable.';
              break;
            case error.TIMEOUT:
              errorMessage += 'Location request timed out.';
              break;
            default:
              errorMessage += 'An unknown error occurred.';
          }
          
          setError(errorMessage);
          setIsUpdating(false);
          resolve(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    });
  }, []);

  return {
    location,
    isUpdating,
    error,
    updateLocation,
    setLocation
  };
};