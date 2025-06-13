import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  // Test cases that match the actual events table schema
  const testCases = [
    {
      name: 'Normal Event',
      params: {
        title: 'Hackon 2025 - Web Development Workshop',
        date: '2025-06-15T00:00:00.000Z',
        location: 'Tech Hub, Mumbai',
        type: 'offline'
      }
    },
    {
      name: 'Virtual Event',
      params: {
        title: 'Online Coding Competition',
        date: '2025-06-20T00:00:00.000Z',
        location: 'Virtual Event',
        type: 'virtual'
      }
    },
    {
      name: 'Date TBA Event',
      params: {
        title: 'Annual Tech Conference',
        date: '',
        location: 'Conference Center, Delhi',
        type: 'offline',
        date_tba: 'true'
      }
    },
    {
      name: 'Venue TBA Event',
      params: {
        title: 'Startup Pitch Competition',
        date: '2025-07-01T00:00:00.000Z',
        location: '',
        type: 'offline',
        venue_tba: 'true'
      }
    },
    {
      name: 'Time TBA Event',
      params: {
        title: 'AI Workshop Series',
        date: '2025-06-25T00:00:00.000Z',
        location: 'Innovation Lab, Bangalore',
        type: 'offline',
        time_tba: 'true'
      }
    },
    {
      name: 'Long Title Event',
      params: {
        title: 'Advanced Machine Learning and Artificial Intelligence Workshop for Beginners and Professionals',
        date: '2025-06-30T00:00:00.000Z',
        location: 'Tech University Campus, Very Long Address Name',
        type: 'offline'
      }
    },
    {
      name: 'Special Characters Event',
      params: {
        title: 'Hack & Build: AI/ML Challenge (2025)',
        date: '2025-07-05T00:00:00.000Z',
        location: 'Co-working Space "Innovation Hub"',
        type: 'offline'
      }
    },
    {
      name: 'Minimal Data Event',
      params: {
        title: 'Event',
        date: '',
        location: '',
        type: 'offline'
      }
    },
    {
      name: 'All TBA Event',
      params: {
        title: 'Future Tech Event',
        date: '',
        location: '',
        type: 'offline',
        date_tba: 'true',
        time_tba: 'true',
        venue_tba: 'true'
      }
    },    {
      name: 'Invalid Date Event',
      params: {
        title: 'Test Event with Invalid Date',
        date: 'invalid-date-string',
        location: 'Test Location',
        type: 'offline'
      }
    },
    {
      name: 'Paid Event',
      params: {
        title: 'Premium Workshop - Advanced React',
        date: '2025-06-20T00:00:00.000Z',
        location: 'Training Center, Mumbai',
        type: 'offline',
        is_paid: 'true',
        price: '2500'
      }
    },
    {
      name: 'Free Event',
      params: {
        title: 'Community Meetup - Open Source',
        date: '2025-06-18T00:00:00.000Z',
        location: 'Community Hall, Delhi',
        type: 'offline',
        is_paid: 'false'
      }
    },
    {
      name: 'Virtual Paid Event',
      params: {
        title: 'Online Masterclass - AI & ML',
        date: '2025-06-22T00:00:00.000Z',
        location: 'Virtual Event',
        type: 'virtual',
        is_paid: 'true',
        price: '1999'
      }
    }
  ];

  const results = [];
  const baseUrl = new URL(request.url).origin;

  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    const ogUrl = new URL('/api/og/event', baseUrl);
    
    // Set parameters from test case
    Object.entries(testCase.params).forEach(([key, value]) => {
      if (value) {
        ogUrl.searchParams.set(key, value);
      }
    });

    try {
      const response = await fetch(ogUrl.toString());
      const responseText = await response.text();
      
      results.push({
        testCase: testCase.name,
        status: response.status,
        contentType: response.headers.get('Content-Type'),
        url: ogUrl.toString(),
        success: response.ok,
        responseSize: responseText.length,
        isSvg: responseText.startsWith('<svg'),
        hasTitle: responseText.includes(testCase.params.title || 'Hackon Event')
      });
    } catch (error) {
      results.push({
        testCase: testCase.name,
        status: 'ERROR',
        error: error instanceof Error ? error.message : 'Unknown error',
        url: ogUrl.toString(),
        success: false
      });
    }
  }

  const successfulTests = results.filter(r => r.success).length;
  const failedTests = results.filter(r => !r.success);

  return Response.json({
    message: 'OpenGraph Image Generation Test Results',
    summary: {
      total: testCases.length,
      successful: successfulTests,
      failed: failedTests.length,
      successRate: `${Math.round((successfulTests / testCases.length) * 100)}%`
    },
    results,
    failedTests: failedTests.length > 0 ? failedTests : undefined,
    recommendations: failedTests.length > 0 ? [
      'Check server logs for detailed error messages',
      'Verify database schema matches expected fields',
      'Test individual failing URLs in browser',
      'Check if special characters are being handled correctly'
    ] : [
      'All tests passed! OpenGraph generation is working correctly.',
      'Test with real event data from your database',
      'Monitor social media sharing to ensure images display correctly'
    ]
  });
}
