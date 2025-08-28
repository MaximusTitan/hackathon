import { Resend } from 'resend';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL =  "Hackon <hackon@aireadyschool.com>";

let resend: Resend | null = null;

function getClient() {
	if (!RESEND_API_KEY) {
		// email sending disabled: missing RESEND_API_KEY
		return null;
	}
	if (!resend) resend = new Resend(RESEND_API_KEY);
	return resend;
}

export type EventEmailPayload = {
	to: string;
	userName: string;
	event: {
		id: string;
		title: string;
		description?: string | null;
		start_date?: string | null;
		end_date?: string | null;
		start_time?: string | null;
		end_time?: string | null;
		event_type?: string | null;
		meeting_link?: string | null;
		location?: string | null;
		venue_name?: string | null;
		address_line1?: string | null;
		city?: string | null;
		postal_code?: string | null;
		is_paid?: boolean | null;
		price?: number | null;
	};
};

function formatDate(date?: string | null) {
	if (!date) return 'TBA';
	try {
		return new Date(date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
	} catch {
		return date;
	}
}

function buildLayout(htmlInner: string, opts: { title: string; preheader?: string }) {
	const preheader = opts.preheader
		? `<span style=\"display:none !important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;overflow:hidden;mso-hide:all;\">${opts.preheader.replace(/"/g,'&quot;')}</span>`
		: '';
	return `<!DOCTYPE html><html><head><meta charSet=\"utf-8\" />
	<meta name=\"viewport\" content=\"width=device-width,initial-scale=1\" />
	<title>${opts.title}</title></head>
	<body style=\"background:#f2f4f7;margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen,Ubuntu,Cantarell,'Open Sans','Helvetica Neue',Arial,sans-serif;color:#1f2937;-webkit-font-smoothing:antialiased;\">${preheader}
		<table role=\"presentation\" width=\"100%\" cellSpacing=\"0\" cellPadding=\"0\" style=\"padding:32px 12px;\"><tr><td align=\"center\">
			<table role=\"presentation\" width=\"100%\" cellSpacing=\"0\" cellPadding=\"0\" style=\"max-width:640px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 10px rgba(0,0,0,0.05);\">
				${htmlInner}
			</table>
			<div style=\"max-width:640px;margin:24px auto 0;font-size:11px;line-height:1.4;color:#6b7280;\">
				This email was sent to you because you registered for an event hosted on Hackon. If this wasn't you, please disregard.
			</div>
		</td></tr></table>
	</body></html>`;
}

function buildICS(event: EventEmailPayload['event']) {
	if (!event.start_date) return null;
	// Attempt to build DTSTART / DTEND if times exist. Assume UTC for simplicity; could be extended.
	const startDate = event.start_date.split('T')[0];
	const rawStart = startDate + (event.start_time ? 'T' + event.start_time.replace(/:/g,'') + '00' : 'T090000');
	const rawEnd = startDate + (event.end_time ? 'T' + event.end_time.replace(/:/g,'') + '00' : 'T100000');
	const uid = `${event.id}@hackon`; 
	const summary = event.title.replace(/\n/g,' ');
	const desc = (event.description || '').replace(/\r?\n/g,' ').replace(/<[^>]+>/g,' ').slice(0, 900);
	const loc = [event.venue_name, event.address_line1, event.city, event.postal_code].filter(Boolean).join(', ');
	const ics = [
		'BEGIN:VCALENDAR',
		'VERSION:2.0',
		'PRODID:-//Hackon//Event//EN',
		'CALSCALE:GREGORIAN',
		'METHOD:PUBLISH',
		'BEGIN:VEVENT',
		`UID:${uid}`,
		`DTSTAMP:${new Date().toISOString().replace(/[-:]/g,'').replace(/\..+/,'Z')}`,
		`DTSTART:${rawStart}Z`,
		`DTEND:${rawEnd}Z`,
		`SUMMARY:${summary}`,
		desc ? `DESCRIPTION:${desc}` : '',
		loc ? `LOCATION:${loc}` : '',
		'END:VEVENT',
		'END:VCALENDAR'
	].filter(Boolean).join('\r\n');
	return ics;
}

export async function sendEventRegistrationEmail(payload: EventEmailPayload) {
	const client = getClient();
	if (!client) return { skipped: true };

	const { to, userName, event } = payload;
	if (!to) {
		// missing recipient email, aborting send
		return { ok: false, error: 'Missing recipient' };
	}
	const eventUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://hackon.com'}/events/${encodeURIComponent(event.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''))}`;
	const logoUrl = 'https://ygogwzwqvsxataluhhsz.supabase.co/storage/v1/object/public/logo/hack-on-logo.png';

	const locationParts = [event.venue_name, event.address_line1, event.city, event.postal_code].filter(Boolean).join(', ');
	const isVirtual = event.event_type === 'virtual';

	const detailsRows: string[] = [];
	detailsRows.push(`<tr><td style="padding:6px 10px; font-weight:600; background:#fafafa; width:130px">Date</td><td style="padding:6px 10px;">${formatDate(event.start_date)}${event.end_date && event.end_date !== event.start_date ? ' - ' + formatDate(event.end_date) : ''}</td></tr>`);
	if (event.start_time || event.end_time) {
		detailsRows.push(`<tr><td style="padding:6px 10px; font-weight:600; background:#fafafa;">Time</td><td style="padding:6px 10px;">${event.start_time || 'TBA'}${event.end_time ? ' - ' + event.end_time : ''}</td></tr>`);
	}
	detailsRows.push(`<tr><td style="padding:6px 10px; font-weight:600; background:#fafafa;">Type</td><td style="padding:6px 10px;">${isVirtual ? 'Online' : (event.event_type ? event.event_type.charAt(0).toUpperCase()+event.event_type.slice(1) : 'Offline')}</td></tr>`);
	if (isVirtual && event.meeting_link) {
		detailsRows.push(`<tr><td style="padding:6px 10px; font-weight:600; background:#fafafa;">Join Link</td><td style="padding:6px 10px;"><a href="${event.meeting_link}" style="color:#e11d48; text-decoration:none;">${event.meeting_link}</a></td></tr>`);
	}
	if (!isVirtual && locationParts) {
		detailsRows.push(`<tr><td style="padding:6px 10px; font-weight:600; background:#fafafa;">Location</td><td style="padding:6px 10px;">${locationParts}</td></tr>`);
	}
	detailsRows.push(`<tr><td style="padding:6px 10px; font-weight:600; background:#fafafa;">Payment</td><td style="padding:6px 10px;">${event.is_paid ? (event.price ? '₹'+event.price : 'Paid Event') : 'Free'}</td></tr>`);

	const primaryColor = '#e11d48';
	const secondaryBg = '#111827';
	const header = `<tr><td style=\"background:${secondaryBg};padding:20px 28px;text-align:left;\">\n  <a href=\"${process.env.NEXT_PUBLIC_SITE_URL || 'https://hackon.com'}\" style=\"text-decoration:none;display:inline-flex;align-items:center;gap:8px;\">\n    <img src=\"${logoUrl}\" alt=\"Hackon\" width=\"150\" style=\"display:block;max-width:170px;height:auto;\" />\n  </a>\n</td></tr>`;
	const intro = `<tr><td style=\"padding:32px 32px 8px 32px;\">\n  <h1 style=\"margin:0 0 14px 0;font-size:22px;line-height:1.25;color:#111827;font-weight:600;\">Your Registration is Confirmed</h1>\n  <p style=\"margin:0 0 14px 0;font-size:15px;line-height:1.5;\">Dear ${userName || 'Participant'},</p>\n  <p style=\"margin:0 0 18px 0;font-size:15px;line-height:1.55;\">Thank you for registering for <strong style=\"color:${primaryColor}\">${event.title}</strong>. Below is a summary of the event.</p>\n</td></tr>`;
	const details = `<tr><td style=\"padding:0 32px 24px 32px;\">\n  <table role=\"presentation\" width=\"100%\" cellSpacing=\"0\" cellPadding=\"0\" style=\"border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;font-size:13px;line-height:1.45;\">${detailsRows.join('')}\n  </table>\n</td></tr>`;
	const about = event.description ? `<tr><td style=\"padding:4px 32px 12px 32px;\">\n  <h2 style=\"font-size:16px;margin:12px 0 8px 0;color:#111827;font-weight:600;\">Overview</h2>\n  <div style=\"font-size:13px;line-height:1.55;color:#374151;\">${event.description.slice(0, 800)}${event.description.length > 800 ? '…' : ''}</div>\n</td></tr>` : '';
	const cta = `<tr><td style=\"padding:8px 32px 34px 32px;\">\n  <a href=\"${eventUrl}\" style=\"background:${primaryColor};color:#ffffff;padding:12px 26px;border-radius:8px;font-size:14px;font-weight:600;text-decoration:none;display:inline-block;\">View Event Page</a>\n  <p style=\"margin:22px 0 0 0;font-size:12px;color:#6b7280;line-height:1.5;\"></p>\n</td></tr>`;
	const footer = `<tr><td style=\"background:#f3f4f6;padding:16px 22px;text-align:center;font-size:11px;color:#6b7280;line-height:1.4;\">© ${new Date().getFullYear()} Hackon.co All rights reserved.<br/>Hackon Platform</td></tr>`;
	const composed = header + intro + details + about + cta + footer;
	const html = buildLayout(composed, { title: `${event.title} Registration Confirmation`, preheader: `Registration confirmed for ${event.title}` });

	const text = `Registration Confirmed\n\nEvent: ${event.title}\nDate: ${formatDate(event.start_date)}${event.end_date && event.end_date !== event.start_date ? ' - ' + formatDate(event.end_date) : ''}\nTime: ${(event.start_time || 'TBA') + (event.end_time ? ' - ' + event.end_time : '')}\nType: ${isVirtual ? 'Online' : 'Offline'}${isVirtual && event.meeting_link ? '\nJoin: ' + event.meeting_link : ''}${!isVirtual && locationParts ? '\nLocation: ' + locationParts : ''}\nPayment: ${event.is_paid ? (event.price ? '₹' + event.price : 'Paid Event') : 'Free'}\n\nEvent Page: ${eventUrl}`;

	// Optional ICS attachment
	const ics = buildICS(event);
	const attachments = ics ? [{ filename: 'event.ics', content: Buffer.from(ics).toString('base64') }] : undefined;

	try {
			const res = await client.emails.send({
				from: FROM_EMAIL,
				to,
				subject: `Registration Confirmed – ${event.title}`,
				html,
				text,
				attachments
			});
			// email sent
			return { ok: true, id: (res as any)?.id, calendarAttached: !!ics };
	} catch (err) {
		// resend email error
			if (process.env.EVENT_EMAIL_STRICT === 'true') {
				throw err;
			}
			return { ok: false, error: (err as Error).message };
	}
}

