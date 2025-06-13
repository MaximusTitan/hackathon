import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const title = searchParams.get('title') || 'Hackon Event';
    const date = searchParams.get('date') || '';
    const location = searchParams.get('location') || '';
    const eventType = searchParams.get('type') || 'event';    // Format date for display
    const formattedDate = date ? new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }) : '';

    // Handle title wrapping
    const maxTitleLength = 60;
    const titleLines = [];
    if (title.length > maxTitleLength) {
      const words = title.split(' ');
      let currentLine = '';
      for (const word of words) {
        if ((currentLine + word).length > maxTitleLength) {
          if (currentLine) titleLines.push(currentLine.trim());
          currentLine = word + ' ';
        } else {
          currentLine += word + ' ';
        }
      }
      if (currentLine) titleLines.push(currentLine.trim());
    } else {
      titleLines.push(title);
    }

    // Limit to 2 lines
    if (titleLines.length > 2) {
      titleLines[1] = titleLines[1].substring(0, maxTitleLength - 3) + '...';
      titleLines.splice(2);
    }

    // Create SVG
    const svg = `
      <svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#e11d48;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#be185d;stop-opacity:1" />
          </linearGradient>
        </defs>
        
        <!-- Background -->
        <rect width="1200" height="630" fill="url(#bg)"/>
        
        <!-- Logo Background -->
        <rect x="545" y="120" width="50" height="50" rx="12" fill="white"/>
        
        <!-- Logo Text -->
        <text x="575" y="155" font-family="Arial, sans-serif" font-size="28" font-weight="bold" fill="#e11d48" text-anchor="middle">H</text>
        
        <!-- Brand -->
        <text x="600" y="155" font-family="Arial, sans-serif" font-size="32" font-weight="bold" fill="white" text-anchor="start">HACKON</text>
          <!-- Title -->
        ${titleLines.map((line, index) => 
          `<text x="600" y="${220 + (index * 50)}" font-family="Arial, sans-serif" font-size="${Math.min(48, Math.max(24, 720 / line.length))}" font-weight="bold" fill="white" text-anchor="middle">${line}</text>`
        ).join('')}
        
        <!-- Date -->
        ${formattedDate ? `<text x="600" y="${titleLines.length > 1 ? '350' : '320'}" font-family="Arial, sans-serif" font-size="24" fill="white" text-anchor="middle">📅 ${formattedDate}</text>` : ''}
        
        <!-- Location -->
        ${location ? `<text x="600" y="${titleLines.length > 1 ? '390' : '360'}" font-family="Arial, sans-serif" font-size="24" fill="white" text-anchor="middle">${eventType === 'virtual' ? '💻' : '📍'} ${location.length > 40 ? location.substring(0, 37) + '...' : location}</text>` : ''}
        
        <!-- CTA -->
        <rect x="500" y="${titleLines.length > 1 ? '450' : '420'}" width="200" height="60" rx="12" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.3)" stroke-width="2"/>
        <text x="600" y="${titleLines.length > 1 ? '490' : '460'}" font-family="Arial, sans-serif" font-size="20" font-weight="600" fill="white" text-anchor="middle">Join the Event</text>
        
        <!-- Brand Footer -->
        <text x="1120" y="580" font-family="Arial, sans-serif" font-size="18" fill="rgba(255,255,255,0.8)" text-anchor="end">hackon.com</text>
      </svg>
    `;

    return new Response(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (e: any) {
    console.log(`Failed to generate OG image: ${e.message}`);
    return new Response(`Failed to generate the image`, {
      status: 500,
    });
  }
}
