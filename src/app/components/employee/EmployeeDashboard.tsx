'use client';

import Image from 'next/image';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Journey, JourneyRequest } from '@/types/transport';
import toast from 'react-hot-toast';
import { useJourney } from '@/app/hooks/useJourney';
import { useLocation } from '@/app/hooks/useLocation';
import { useEmployee } from '@/app/hooks/useEmployee';
import ParamountLoader from '../Loader';
import EmployeeDashboardTab from './EmployeeDashboardTab';
import ProfileTab from './EmployeeProfileTab';
import TravelLogsTab from '../Travell/TravelLogsTab';
import CarsTab from '../Travell/CarsTab';
import BookRideTab from '../Travell/BookRideTab';
import { LogOutButton } from '../LogOutButton';
import EmployeeHeader from './EmployeeHeader';

// Add notification sound
const playNotificationSound = () => {
  try {
    const audio = new Audio('/sounds/notification.mp3');
    audio.play().catch(() => {
      // Fallback to browser notification if sound fails
      if (Notification.permission === 'granted') {
        new Notification('Journey Assigned!', {
          body: 'Check your active journey details.',
          icon: '/favicon.ico'
        });
      }
    });
  } catch (error) {
    console.log('Notification sound not available');
  }
};

export default function EmployeeDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedDestination, setSelectedDestination] = useState('');
  const [notificationEnabled, setNotificationEnabled] = useState(false);

  const { user, isLoading, error, refreshUser, updateProfile } = useEmployee();
  const { 
    journeys, 
    isLoading: journeysLoading, 
    bookingState, 
    requestTransport, 
    cancelBooking,
    completeJourney,
    updateJourney
  } = useJourney(user?.username);
  const { location, updateLocation } = useLocation();

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window) {
      Notification.requestPermission().then(permission => {
        setNotificationEnabled(permission === 'granted');
      });
    }
  }, []);

  // Check for new journey assignments periodically
  useEffect(() => {
    if (!user) return;

    const checkForNewAssignments = async () => {
      try {
        const response = await fetch(`/api/user/journey?userId=${user.username}`);
        if (response.ok) {
          const data = await response.json();
          const assignedJourney = data.find((j: Journey) => 
            j.status === 'in-progress' && 
            !journeys.some(existing => existing.id === j.id)
          );

          if (assignedJourney) {
            // Play sound and show notification
            playNotificationSound();
            
            // Vibrate if supported
            if (navigator.vibrate) {
              navigator.vibrate([200, 100, 200]);
            }

            toast.success('A journey has been assigned to you!', {
              duration: 5000,
              position: 'top-right'
            });

            // Refresh journey data
            refreshUser();
          }
        }
      } catch (error) {
        console.error('Error checking assignments:', error);
      }
    };

    // Check every 30 seconds
    const interval = setInterval(checkForNewAssignments, 30000);
    return () => clearInterval(interval);
  }, [user, journeys, refreshUser]);

  // Update location on mount and periodically
  useEffect(() => {
    if (user) {
      updateLocation(user.username);
      
      // Update location every 2 minutes
      const locationInterval = setInterval(
        () => updateLocation(user.username), 
        120000
      );
      
      return () => clearInterval(locationInterval);
    }
  }, [user, updateLocation]);

  // Redirect if not logged in
  useEffect(() => {
    const username = localStorage.getItem('user');
    if (!username) {
      router.push('/login');
    }
  }, [router]);

  // Handle destination selection with Google Maps integration
  const handleDestinationSelect = useCallback(async (query: string) => {
    try {
      // Use Google Places API for autocomplete
      if (!query.trim()) return;
      
      const response = await fetch(
        `/api/maps/autocomplete?query=${encodeURIComponent(query)}`
      );
      
      if (response.ok) {
        const predictions = await response.json();
        // Handle predictions and set destination
        if (predictions.length > 0) {
          setSelectedDestination(predictions[0].description);
        }
      }
    } catch (error) {
      console.error('Error fetching places:', error);
    }
  }, []);

  // Handle transport request
  const handleTransportRequest = async (journey: JourneyRequest): Promise<Journey | null | undefined> => {
    if (!selectedDestination) {
      toast.error('Please select a destination');
      return null;
    }

    const result = await requestTransport(journey);
    if (result) {
      setSelectedDestination('');
    }
  };

  // Handle journey completion with rating
  const handleJourneyComplete = async (journeyId: string, rating: number, comment?: string) => {
    const success = await completeJourney(journeyId, rating, comment);
    if (success) {
      refreshUser();
    }
  };

  // Handle route change
  const handleRouteChange = async (journeyId: string, newStop: string) => {
    try {
      const response = await fetch('/api/journeys/route-change', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ journeyId, newStop }),
      });

      if (response.ok) {
        toast.success('Route change request sent');
      } else {
        throw new Error('Failed to request route change');
      }
    } catch (error) {
      toast.error('Failed to request route change');
    }
  };

  // Loading state
  if (isLoading) {
    return <ParamountLoader/>;
  }

  // Error state
  if (error || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'User not found'}</p>
          <button 
            onClick={() => router.push('/login')}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-secondary transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Header with navigation */}
      <div className='sticky top-0 z-50 bg-background shadow-sm flex items-center justify-between p-2 md:p-4 mx-auto w-full'>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center">
            <Image
              src="/p1.png"
              alt="Paramount Logo"
              width={8}
              height={8}
              className="drop-shadow-xl"
            />
            <Image
              src="/p2.png"
              alt="Paramount Logo"
              width={8}
              height={8}
              className="drop-shadow-xl"
            />
            <Image
              src="/p3.png"
              alt="Paramount Logo"
              width={8}
              height={8}
              className="drop-shadow-xl"
            />
            <Image
              src="/p4.png"
              alt="Paramount Logo"
              width={8}
              height={8}
              className="drop-shadow-xl"
            />
          </div>
          <div className="hidden sm:flex items-center space-x-3 rounded-xl p-2 border border-slate-200">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-sm font-medium text-white">
              {user?.username?.charAt(0).toUpperCase()}
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-gray-800">
                {`${user?.firstName || ''} ${user?.lastName || ''}`.trim()}
              </p>
              <p className="text-xs text-gray-500">{user?.position}</p>
            </div>
          </div>
        </div>
        <EmployeeHeader 
          user={user} 
          activeTab={activeTab} 
          isMobileMenuOpen={isMobileMenuOpen}
          setActiveTab={setActiveTab}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
        />
        <LogOutButton username={user.username} />
      </div>
      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        {/* Tab Content */}
        <div className="mt-6">
          {activeTab === 'dashboard' && (
            <EmployeeDashboardTab
              user={user}
              journeys={journeys}
              cars={user.assignedCars || []}
              onAction={(action) => {
                switch (action) {
                  case 'book-ride':
                    setActiveTab('book-ride');
                    break;
                  case 'route-change':
                    // Handle route change
                    break;
                }
              }}
            />
          )}

          {activeTab === 'profile' && (
            <ProfileTab
              user={user}
              onUpdate={updateProfile}
              currentLocation={location}
              onUpdateLocation={async () => {
                await updateLocation(user.username);
              }}
            />
          )}

          {activeTab === 'travel-logs' && (
            <TravelLogsTab journeys={journeys} />
          )}

          {activeTab === 'cars' && (
            <CarsTab cars={user.assignedCars || []} />
          )}

          {activeTab === 'book-ride' && (
            <BookRideTab
              bookingState={bookingState}
              selectedDestination={selectedDestination}
              onDestinationChange={handleDestinationSelect}
              onRequest={handleTransportRequest}
              onCancel={async (journeyId: string) => {
                await cancelBooking(journeyId);
              }}
              isLoading={journeysLoading}
              previousDestinations={journeys
                .map(j => j.endLocation?.address)
                .filter((addr): addr is string => typeof addr === 'string' && addr.trim() !== '')
                .filter((addr, index, self) => self.indexOf(addr) === index)
              }
            />
          )}
        </div>
      </div>
    </div>
  );
}