// app/api/roads/speed-limits/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { placeIds } = await request.json();
    const apiKey = process.env.GOOGLE_ROADS_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Google Roads API key not configured' },
        { status: 500 }
      );
    }

    const placeIdsStr = placeIds.join('|');
    
    const response = await fetch(
      `https://roads.googleapis.com/v1/speedLimits?` +
      `placeId=${placeIdsStr}&key=${apiKey}`
    );

    if (!response.ok) {
      throw new Error(`Google Roads API error: ${response.statusText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Speed limits error:', error);
    return NextResponse.json(
      { error: 'Failed to get speed limits' },
      { status: 500 }
    );
  }
}