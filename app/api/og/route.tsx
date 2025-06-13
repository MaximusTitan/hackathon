import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Get parameters with defaults
    const title = searchParams.get('title')?.slice(0, 100) || 'Hackon Event';
    const rawDate = searchParams.get('date') || '';
    const location = searchParams.get('location') || '';
    const eventType = searchParams.get('type') || 'offline';
    const dateTba = searchParams.get('date_tba') === 'true';
    const timeTba = searchParams.get('time_tba') === 'true';
    const venueTba = searchParams.get('venue_tba') === 'true';
    const isPaid = searchParams.get('is_paid') === 'true';
    const price = searchParams.get('price') || '';

    // Format date
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
    }

    // Handle location display
    const getLocationDisplay = () => {
      if (venueTba) return 'Venue TBA';
      if (eventType === 'virtual') return 'Virtual Event';
      if (location) return location.length > 40 ? location.substring(0, 37) + '...' : location;
      return 'Location TBD';
    };

    const locationDisplay = getLocationDisplay();

    // Handle title wrapping for better display
    const titleLines = [];
    const maxLength = 45;
    
    if (title.length > maxLength) {
      const words = title.split(' ');
      let currentLine = '';
      
      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        if (testLine.length > maxLength && currentLine) {
          titleLines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }
      if (currentLine) titleLines.push(currentLine);
    } else {
      titleLines.push(title);
    }

    // Limit to 2 lines
    if (titleLines.length > 2) {
      titleLines.splice(2);
      titleLines[1] = titleLines[1].length > maxLength ? 
        titleLines[1].substring(0, maxLength - 3) + '...' : titleLines[1];
    }

    return new ImageResponse(
      (
        <div
          style={{
            background: 'linear-gradient(135deg, #e11d48 0%, #be185d 100%)',
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontFamily: 'Arial, sans-serif',
          }}
        >
          {/* Logo and Brand */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '30px',
            }}
          >
            <div
              style={{
                width: '50px',
                height: '50px',
                backgroundColor: 'white',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#e11d48',
                fontSize: '28px',
                fontWeight: 'bold',
                marginRight: '15px',
              }}
            >
              H
            </div>
            <div
              style={{
                fontSize: '32px',
                fontWeight: 'bold',
              }}
            >
              HACKON
            </div>
          </div>

          {/* Event Title */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              marginBottom: '30px',
            }}
          >
            {titleLines.map((line, index) => (
              <div
                key={index}
                style={{
                  fontSize: titleLines.length > 1 ? '42px' : '48px',
                  fontWeight: 'bold',
                  lineHeight: '1.2',
                  marginBottom: index === titleLines.length - 1 ? '0' : '8px',
                }}
              >
                {line}
              </div>
            ))}
          </div>

          {/* Date */}
          {formattedDate && (
            <div
              style={{
                fontSize: '24px',
                marginBottom: '15px',
                opacity: 0.9,
                display: 'flex',
                alignItems: 'center',
              }}
            >
              📅 {formattedDate}
            </div>
          )}

          {/* Location */}
          {locationDisplay && (
            <div
              style={{
                fontSize: '24px',
                marginBottom: '15px',
                opacity: 0.9,
                display: 'flex',
                alignItems: 'center',
              }}
            >
              {eventType === 'virtual' ? '💻' : '📍'} {locationDisplay}
            </div>
          )}

          {/* Price/Free indicator */}
          {isPaid && price ? (
            <div
              style={{
                fontSize: '20px',
                marginBottom: '30px',
                color: '#fbbf24',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              💰 ₹{price}
            </div>
          ) : !isPaid ? (
            <div
              style={{
                fontSize: '20px',
                marginBottom: '30px',
                color: '#10b981',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              🎟️ Free Event
            </div>
          ) : null}

          {/* CTA Button */}
          <div
            style={{
              backgroundColor: 'rgba(255,255,255,0.15)',
              border: '2px solid rgba(255,255,255,0.3)',
              borderRadius: '12px',
              padding: '15px 30px',
              fontSize: '20px',
              fontWeight: '600',
              marginBottom: '30px',
            }}
          >
            Join the Event
          </div>

          {/* Footer */}
          <div
            style={{
              position: 'absolute',
              bottom: '30px',
              right: '30px',
              fontSize: '18px',
              opacity: 0.8,
            }}
          >
            hackon.co
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      },
    );
  } catch (e: any) {
    console.error('Failed to generate OG image:', e.message);
    
    // Fallback image
    return new ImageResponse(
      (
        <div
          style={{
            background: '#e11d48',
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '48px',
            fontWeight: 'bold',
            fontFamily: 'Arial, sans-serif',
          }}
        >
          Hackon Event
        </div>
      ),
      {
        width: 1200,
        height: 630,
      },
    );
  }
}
