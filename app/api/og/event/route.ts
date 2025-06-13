import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
      // Safely get and sanitize parameters
    const rawTitle = searchParams.get('title') || 'Hackon Event';
    const rawDate = searchParams.get('date') || '';
    const rawLocation = searchParams.get('location') || '';    const eventType = searchParams.get('type') || 'event';
    const dateTba = searchParams.get('date_tba') === 'true';
    const timeTba = searchParams.get('time_tba') === 'true';
    const venueTba = searchParams.get('venue_tba') === 'true';
    const isPaid = searchParams.get('is_paid') === 'true';
    const price = searchParams.get('price') || '';

    // Sanitize title for SVG (escape XML special characters)
    const sanitizeText = (text: string) => {
      return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    };

    const title = sanitizeText(rawTitle);
    const location = sanitizeText(rawLocation);    // Safely format date
    let formattedDate = '';
    if (dateTba) {
      formattedDate = 'Date TBA';
    } else if (rawDate) {
      try {
        const date = new Date(rawDate);
        if (!isNaN(date.getTime())) {
          formattedDate = date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });
          if (timeTba) {
            formattedDate += ' • Time TBA';
          }
        }
      } catch (error) {
        console.warn('Failed to parse date:', rawDate);
      }
    }// Handle title wrapping with safer logic
    const maxTitleLength = 50; // Reduced for better display
    const titleLines = [];
    
    if (title.length > maxTitleLength) {
      const words = title.split(' ');
      let currentLine = '';
      
      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        
        if (testLine.length > maxTitleLength && currentLine) {
          titleLines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }
      
      if (currentLine) {
        titleLines.push(currentLine);
      }
    } else {
      titleLines.push(title);
    }

    // Ensure we don't exceed 2 lines and handle long words
    if (titleLines.length > 2) {
      titleLines.splice(2);
      titleLines[1] = titleLines[1].length > maxTitleLength ? 
        titleLines[1].substring(0, maxTitleLength - 3) + '...' : titleLines[1];
    }

    // Handle case where individual words are too long
    const processedTitleLines = titleLines.map(line => 
      line.length > maxTitleLength ? line.substring(0, maxTitleLength - 3) + '...' : line
    );

    // Safely calculate font sizes
    const getFontSize = (text: string) => {
      const baseSize = Math.min(48, Math.max(24, 720 / Math.max(text.length, 1)));
      return Math.floor(baseSize); // Ensure integer font size
    };    // Create SVG with better error handling
    const svg = `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
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
        ${processedTitleLines.map((line, index) => 
          `<text x="600" y="${220 + (index * 50)}" font-family="Arial, sans-serif" font-size="${getFontSize(line)}" font-weight="bold" fill="white" text-anchor="middle">${line}</text>`
        ).join('')}
        
        <!-- Date -->
        ${formattedDate ? `<text x="600" y="${processedTitleLines.length > 1 ? '350' : '320'}" font-family="Arial, sans-serif" font-size="24" fill="white" text-anchor="middle">📅 ${formattedDate}</text>` : ''}        <!-- Location -->
        ${location ? `<text x="600" y="${processedTitleLines.length > 1 ? '390' : '360'}" font-family="Arial, sans-serif" font-size="24" fill="white" text-anchor="middle">${eventType === 'virtual' ? '💻' : '📍'} ${venueTba ? 'Venue TBA' : (location.length > 35 ? location.substring(0, 32) + '...' : location)}</text>` : ''}
        
        <!-- Price/Free indicator -->
        ${isPaid && price ? `<text x="600" y="${processedTitleLines.length > 1 ? '430' : '400'}" font-family="Arial, sans-serif" font-size="20" fill="#fbbf24" text-anchor="middle">💰 ₹${price}</text>` : !isPaid ? `<text x="600" y="${processedTitleLines.length > 1 ? '430' : '400'}" font-family="Arial, sans-serif" font-size="20" fill="#10b981" text-anchor="middle">🎟️ Free Event</text>` : ''}
        
        <!-- CTA -->
        <rect x="500" y="${processedTitleLines.length > 1 ? '470' : '440'}" width="200" height="60" rx="12" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.3)" stroke-width="2"/>
        <text x="600" y="${processedTitleLines.length > 1 ? '510' : '480'}" font-family="Arial, sans-serif" font-size="20" font-weight="600" fill="white" text-anchor="middle">Join the Event</text>
        
        <!-- Brand Footer -->
        <text x="1120" y="580" font-family="Arial, sans-serif" font-size="18" fill="rgba(255,255,255,0.8)" text-anchor="end">hackon.com</text>
      </svg>`;    return new Response(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (e: any) {
    console.error(`Failed to generate OG image:`, {
      error: e.message,
      stack: e.stack,
      url: request.url,
      searchParams: Object.fromEntries(new URL(request.url).searchParams)
    });
    
    // Return a simple fallback SVG instead of error
    const fallbackSvg = `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
      <rect width="1200" height="630" fill="#e11d48"/>
      <text x="600" y="315" font-family="Arial, sans-serif" font-size="48" font-weight="bold" fill="white" text-anchor="middle">Hackon Event</text>
    </svg>`;
    
    return new Response(fallbackSvg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=300',
      },
    });
  }
}
