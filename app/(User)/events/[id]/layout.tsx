import { Metadata } from 'next';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

type Props = {
  params: Promise<{ id: string }>;
  children: React.ReactNode;
};

async function getEvent(eventParam: string) {
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });
  
  try {
    // Check if it's a UUID or title slug
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(eventParam);
    
    let query = supabase.from('events').select('*');
    
    if (isUUID) {
      query = query.eq('id', eventParam);    } else {
      // Convert URL slug back to title for matching
      const decodedTitle = decodeURIComponent(eventParam).replace(/-/g, ' ');
      query = query.ilike('title', decodedTitle);
    }
    
    const { data: events, error } = await query.limit(1);
    
    if (error || !events || events.length === 0) {
      return null;
    }
    
    return events[0];
  } catch (error) {
    console.error('Error fetching event for metadata:', error);
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const event = await getEvent(resolvedParams.id);
  
  if (!event) {
    return {
      title: 'Event Not Found | Hackon',
      description: 'The requested event could not be found.',
    };
  }

  // Safely handle event data
  const eventTitle = `${event.title || 'Untitled Event'} | Hackon`;
  const rawDescription = event.description || '';
  const eventDescription = rawDescription
    ? rawDescription.replace(/<[^>]*>/g, '').substring(0, 160) + '...'
    : `Join ${event.title || 'this event'} - an amazing event hosted by Hackon.`;
  // Safely format date for OG image
  let eventDate = '';
  if (event.start_date && !event.date_tba) {
    try {
      // Handle date field (which comes as date type from database)
      const date = new Date(event.start_date);
      if (!isNaN(date.getTime())) {
        eventDate = date.toISOString();
      }
    } catch (error) {
      console.warn('Failed to parse event date:', event.start_date);
    }
  }
    // Get location for OG image with error handling
  const getLocationDisplay = () => {
    try {
      // Handle venue_tba flag
      if (event.venue_tba) {
        return "Venue TBA";
      }
      
      if (event.event_type === "virtual") {
        return "Virtual Event";
      } else if (event.location && event.location.trim()) {
        return event.location.trim();
      } else if (event.venue_name && event.venue_name.trim()) {
        const cityPart = event.city && event.city.trim() ? `, ${event.city.trim()}` : "";
        return `${event.venue_name.trim()}${cityPart}`;
      }
      return "Location TBD";
    } catch (error) {
      console.warn('Error getting location display:', error);
      return "Location TBD";
    }
  };

  const locationDisplay = getLocationDisplay();  // Generate OG image URL with error handling
  const getBaseUrl = () => {
    // For WhatsApp and social media crawlers, we need the absolute production URL
    if (process.env.NEXT_PUBLIC_SITE_URL) {
      return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, ''); // Remove trailing slash
    }
    // Vercel deployment URL (fallback)
    if (process.env.VERCEL_URL) {
      return `https://${process.env.VERCEL_URL}`;
    }
    // Production fallback
    if (process.env.NODE_ENV === 'production') {
      return 'https://hackon.co';
    }
    // Development - Note: WhatsApp won't work with localhost
    return 'http://localhost:3000';
  };
  const baseUrl = getBaseUrl();
  const ogImageUrl = new URL('/api/og', baseUrl);
  // Safely set search parameters
  try {
    ogImageUrl.searchParams.set('title', event.title || 'Hackon Event');
    if (eventDate) ogImageUrl.searchParams.set('date', eventDate);
    if (locationDisplay) ogImageUrl.searchParams.set('location', locationDisplay);
    if (event.event_type) ogImageUrl.searchParams.set('type', event.event_type);
      // Pass TBA flags for better handling
    if (event.date_tba) ogImageUrl.searchParams.set('date_tba', 'true');
    if (event.time_tba) ogImageUrl.searchParams.set('time_tba', 'true');
    if (event.venue_tba) ogImageUrl.searchParams.set('venue_tba', 'true');
    
    // Pass payment information
    if (event.is_paid) ogImageUrl.searchParams.set('is_paid', 'true');
    if (event.price && event.price > 0) ogImageUrl.searchParams.set('price', event.price.toString());
  } catch (error) {
    console.warn('Error setting OG image parameters:', error);
  }
  // Log for debugging in development
  if (process.env.NODE_ENV === 'development') {
    console.log('Generated OG Image URL:', ogImageUrl.toString());
  }

  // Determine the primary image to use
  const primaryImageUrl = event.image_url || ogImageUrl.toString();
  const primaryImageType = event.image_url ? 
    (event.image_url.toLowerCase().includes('.png') ? 'image/png' : 'image/jpeg') : 
    'image/png';

  return {
    title: eventTitle,
    description: eventDescription,
    openGraph: {
      title: eventTitle,
      description: eventDescription,
      type: 'website',
      images: [
        {
          url: primaryImageUrl,
          width: 1200,
          height: 630,
          alt: event.image_url ? (event.title || 'Event Image') : `${event.title || 'Event'} - Hackon Event`,
          type: primaryImageType,
        }
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: eventTitle,
      description: eventDescription,
      images: [primaryImageUrl],
    },
  };
}

export default function EventLayout({ children }: Props) {
  return children;
}
