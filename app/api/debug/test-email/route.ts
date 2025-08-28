import { NextResponse } from 'next/server';
import { sendEventRegistrationEmail } from '@/utils/email-service';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const to = body.to as string | undefined;
    if (!to) return NextResponse.json({ error: 'Missing to' }, { status: 400 });

    const fakeEvent = {
      id: 'debug-event',
      title: body.title || 'Debug Event',
      description: 'This is a <strong>debug</strong> email test.',
      start_date: new Date().toISOString(),
      end_date: null,
      start_time: '10:00',
      end_time: '11:00',
      event_type: 'virtual',
      meeting_link: 'https://example.com/meet',
      location: null,
      venue_name: null,
      address_line1: null,
      city: null,
      postal_code: null,
      is_paid: false,
      price: null
    };

    const result = await sendEventRegistrationEmail({
      to,
      userName: body.userName || 'Tester',
      event: fakeEvent
    });

    return NextResponse.json({ result });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
