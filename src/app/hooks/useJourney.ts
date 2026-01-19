import { useState, useCallback, useEffect } from 'react';
import { Journey, BookingRequest, BookingState, JourneyRequest } from '@/types/transport';
import toast from 'react-hot-toast';

const COOLDOWN_PERIOD = 5 * 60 * 1000; // 5 minutes

export const useJourney = (userId?: string) => {
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [bookingState, setBookingState] = useState<BookingState>({
    isBookingAllowed: true,
    lastBookingTime: null,
    cooldownRemaining: 0,
    hasActiveRequest: false
  });

  // Check booking status on mount and periodically
  useEffect(() => {
    const checkBookingStatus = () => {
      if (!userId) return;
      
      try {
        const storedBooking = localStorage.getItem(`user_${userId}_journey_request`);
        if (storedBooking) {
          const booking: BookingRequest = JSON.parse(storedBooking);
          const bookingTime = new Date(booking.timestamp);
          const currentTime = new Date();
          const timeDiff = currentTime.getTime() - bookingTime.getTime();

          if (timeDiff < COOLDOWN_PERIOD) {
            setBookingState({
              isBookingAllowed: false,
              lastBookingTime: bookingTime,
              cooldownRemaining: COOLDOWN_PERIOD - timeDiff,
              hasActiveRequest: true,
              activeJourneyId: booking.journeyId
            });
          } else {
            localStorage.removeItem(`user_${userId}_journey_request`);
            setBookingState(prev => ({
              ...prev,
              isBookingAllowed: true,
              hasActiveRequest: false,
              activeJourneyId: undefined
            }));
          }
        }
      } catch (error) {
        console.error('Error checking booking status:', error);
      }
    };

    checkBookingStatus();
    
    // Update cooldown every second
    const interval = setInterval(() => {
      setBookingState(prev => {
        if (prev.cooldownRemaining > 0) {
          return {
            ...prev,
            cooldownRemaining: prev.cooldownRemaining - 1000,
            isBookingAllowed: prev.cooldownRemaining <= 1000
          };
        }
        return prev;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [userId]);

  // Request transport - FIXED JOURNEY CREATION
  const requestTransport = useCallback(async (journeyRequest: JourneyRequest): Promise<Journey | null> => {
    if (!userId) {
      toast.error("Please login to book a ride");
      return null;
    }

    if (!journeyRequest.startLocation || !journeyRequest.endLocation) {
      toast.error("Please select start and destination locations");
      return null;
    }

    setIsLoading(true);
    try {
      // Create journey object with required fields
      const journeyData = {
        userId: journeyRequest.userId,
        startLocation: journeyRequest.startLocation,
        endLocation: journeyRequest.endLocation,
        startTime: new Date().toISOString(),
        status: 'requested' as const,
        distance: journeyRequest.distance || 0,
        estimatedDuration: journeyRequest.estimatedDuration || 0,
        waypoints: journeyRequest.waypoints || [],
        notes: journeyRequest.specialRequirements || '',
        priority: journeyRequest.priority || 'normal'
      };

      console.log('Sending journey creation request:', journeyData);

      const response = await fetch('/api/user/journey/request', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(journeyData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to request transport');
      }

      const result = await response.json();
      const newJourney: Journey = result.data;

      if (!newJourney.id) {
        throw new Error('Invalid journey response from server');
      }

      // Store booking in localStorage with cooldown
      const bookingRequest: BookingRequest = {
        userId,
        destination: journeyRequest.endLocation.address || '',
        status: 'requested',
        timestamp: new Date(),
        journeyId: newJourney.id
      };
      
      localStorage.setItem(`user_${userId}_journey_request`, JSON.stringify(bookingRequest));

      // Update booking state
      setBookingState({
        isBookingAllowed: false,
        lastBookingTime: new Date(),
        cooldownRemaining: COOLDOWN_PERIOD,
        hasActiveRequest: true,
        activeJourneyId: newJourney.id
      });

      // Add to journeys list
      setJourneys(prev => [newJourney, ...prev]);
      
      toast.success('Transport request sent successfully!');
      return newJourney;
    } catch (error: any) {
      console.error('Error requesting transport:', error);
      toast.error(error.message || 'Failed to request transport');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Cancel booking
  const cancelBooking = useCallback(async (journeyId: string): Promise<boolean> => {
    if (!userId) return false;

    try {
      const response = await fetch('/api/user/journey/cancel', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ 
          journeyId, 
          reason: 'Cancelled by user',
          userId 
        }),
      });

      if (!response.ok) throw new Error('Failed to cancel booking');

      // Clear from localStorage
      localStorage.removeItem(`user_${userId}_journey_request`);
      
      // Update local state
      setJourneys(prev => 
        prev.map(j => j.id === journeyId ? { ...j, status: 'cancelled' } : j)
      );
      
      setBookingState(prev => ({
        ...prev,
        isBookingAllowed: true,
        hasActiveRequest: false,
        activeJourneyId: undefined
      }));

      toast.success('Booking cancelled successfully');
      return true;
    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast.error('Failed to cancel booking');
      return false;
    }
  }, [userId]);

  // Complete journey
  const completeJourney = useCallback(async (journeyId: string, rating?: number, comment?: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/user/journey/complete', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ 
          journeyId, 
          rating, 
          comment,
          endTime: new Date().toISOString()
        }),
      });

      if (!response.ok) throw new Error('Failed to complete journey');

      setJourneys(prev => 
        prev.map(j => j.id === journeyId ? { 
          ...j, 
          status: 'completed', 
          rating,
          endTime: new Date().toISOString(),
          actualDuration: j.estimatedDuration
        } : j)
      );

      toast.success('Journey completed! Thank you for your feedback.');
      return true;
    } catch (error) {
      console.error('Error completing journey:', error);
      toast.error('Failed to complete journey');
      return false;
    }
  }, []);

  // Update journey
  const updateJourney = useCallback((journeyId: string, updates: Partial<Journey>) => {
    setJourneys(prev => 
      prev.map(j => j.id === journeyId ? { ...j, ...updates } : j)
    );
  }, []);

  // Get active journey
  const getActiveJourney = useCallback((): Journey | undefined => {
    return journeys.find(j => 
      j.status === 'requested' || j.status === 'in-progress'
    );
  }, [journeys]);

  // Refresh journeys
  const refreshJourneys = useCallback(async () => {
    if (!userId) return;

    try {
      const response = await fetch(`/api/user/journeys?userId=${userId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setJourneys(data);
      }
    } catch (error) {
      console.error('Error refreshing journeys:', error);
    }
  }, [userId]);

  return {
    journeys,
    isLoading,
    bookingState,
    getActiveJourney,
    requestTransport,
    cancelBooking,
    completeJourney,
    updateJourney,
    refreshJourneys,
    setJourneys
  };
};