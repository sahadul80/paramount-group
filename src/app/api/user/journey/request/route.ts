// app/api/user/journey/request/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Journey, JourneyRequest } from '@/types/transport';

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json() as JourneyRequest;
    
    // Validate required fields
    if (!body.userId || !body.startLocation || !body.endLocation) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Calculate distance if not provided
    const distance = body.distance || calculateDistance(
      body.startLocation,
      body.endLocation
    );

    // Create new journey object with requested status
    const newJourney: Journey = {
      id: generateId(),
      userId: body.userId,
      startLocation: body.startLocation,
      endLocation: body.endLocation,
      startTime: body.preferredTime || new Date().toISOString(),
      status: 'requested',
      distance: distance,
      estimatedDuration: body.estimatedDuration || Math.ceil(distance * 2), // 2 min per km
      waypoints: body.waypoints || [],
      notes: body.specialRequirements || '',
      priority: body.priority || 'normal',
      createdAt: new Date().toISOString()
    };

    // TODO: Save to database
    // await saveJourneyToDatabase(newJourney);

    // Simulate database save
    await new Promise(resolve => setTimeout(resolve, 100));

    return NextResponse.json({
      success: true,
      data: newJourney,
      message: 'Journey request created successfully'
    });

  } catch (error: any) {
    console.error('Error creating journey:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to calculate distance
function calculateDistance(start: any, end: any): number {
  const R = 6371; // Earth's radius in km
  const dLat = (end.lat - start.lat) * Math.PI / 180;
  const dLon = (end.lng - start.lng) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(start.lat * Math.PI / 180) * Math.cos(end.lat * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Helper function to generate ID
function generateId(): string {
  return `journey_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}