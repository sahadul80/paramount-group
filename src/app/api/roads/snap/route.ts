// app/api/roads/snap/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { points } = await request.json();
    const apiKey = process.env.GOOGLE_ROADS_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Google Roads API key not configured' },
        { status: 500 }
      );
    }

    const path = points.map((p: { lat: number; lng: number }) => `${p.lat},${p.lng}`).join('|');
    
    const response = await fetch(
      `https://roads.googleapis.com/v1/snapToRoads?` +
      `path=${encodeURIComponent(path)}&interpolate=true&key=${apiKey}`
    );

    if (!response.ok) {
      throw new Error(`Google Roads API error: ${response.statusText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Snap to roads error:', error);
    return NextResponse.json(
      { error: 'Failed to snap to roads' },
      { status: 500 }
    );
  }
}



