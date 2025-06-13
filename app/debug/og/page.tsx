"use client";

import { useState } from 'react';

export default function OGTestPage() {
  const [title, setTitle] = useState('Sample Event Title');
  const [date, setDate] = useState('2025-06-15T00:00:00.000Z');
  const [location, setLocation] = useState('New York');
  const [eventType, setEventType] = useState('offline');  const [dateTba, setDateTba] = useState(false);
  const [timeTba, setTimeTba] = useState(false);
  const [venueTba, setVenueTba] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [price, setPrice] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  const generateImageUrl = () => {
    const baseUrl = window.location.origin;
    const ogUrl = new URL('/api/og/event', baseUrl);
    
    if (title) ogUrl.searchParams.set('title', title);
    if (date && !dateTba) ogUrl.searchParams.set('date', date);
    if (location && !venueTba) ogUrl.searchParams.set('location', location);
    if (eventType) ogUrl.searchParams.set('type', eventType);    if (dateTba) ogUrl.searchParams.set('date_tba', 'true');
    if (timeTba) ogUrl.searchParams.set('time_tba', 'true');
    if (venueTba) ogUrl.searchParams.set('venue_tba', 'true');
    if (isPaid) ogUrl.searchParams.set('is_paid', 'true');
    if (price && isPaid) ogUrl.searchParams.set('price', price);
    
    setImageUrl(ogUrl.toString());
  };
  const testAPI = async () => {
    try {
      const response = await fetch('/api/og/test');
      const data = await response.json();
      console.log('Test results:', data);
      alert(`Test completed: ${data.summary.successful}/${data.summary.total} tests passed (${data.summary.successRate})`);
    } catch (error) {
      console.error('Test failed:', error);
      alert('Test failed - check console for details');
    }
  };

  const loadTestCase = (testCase: string) => {
    switch (testCase) {
      case 'long-title':
        setTitle('Advanced Machine Learning and Artificial Intelligence Workshop for Beginners and Professionals');
        setLocation('Tech University Campus, Very Long Address Name');
        break;
      case 'special-chars':
        setTitle('Hack & Build: AI/ML Challenge (2025)');
        setLocation('Co-working Space "Innovation Hub"');
        break;
      case 'all-tba':
        setTitle('Future Tech Event');
        setDateTba(true);
        setTimeTba(true);
        setVenueTba(true);
        break;      case 'virtual':
        setTitle('Online Coding Competition');
        setEventType('virtual');
        setLocation('Virtual Event');
        break;
      case 'paid-event':
        setTitle('Premium React Workshop');
        setLocation('Training Center, Mumbai');
        setEventType('offline');
        setIsPaid(true);
        setPrice('2500');
        break;
      case 'free-event':
        setTitle('Community Meetup');
        setLocation('Community Hall, Delhi');
        setEventType('offline');
        setIsPaid(false);
        setPrice('');
        break;
      default:
        setTitle('Sample Event Title');
        setLocation('New York');
        setEventType('offline');
        setDateTba(false);
        setTimeTba(false);
        setVenueTba(false);
        setIsPaid(false);
        setPrice('');
    }
    setTimeout(generateImageUrl, 100);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">OpenGraph Image Testing</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Image Parameters</h2>
          
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-2 border rounded-lg"
              placeholder="Event title"
            />
          </div>
            <div>
            <label className="block text-sm font-medium mb-1">Date</label>
            <input
              type="datetime-local"
              value={date ? new Date(date).toISOString().slice(0, 16) : ''}
              onChange={(e) => setDate(e.target.value ? new Date(e.target.value).toISOString() : '')}
              className="w-full p-2 border rounded-lg"
              disabled={dateTba}
            />
            <label className="flex items-center mt-1">
              <input
                type="checkbox"
                checked={dateTba}
                onChange={(e) => setDateTba(e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm">Date TBA</span>
            </label>
          </div>
          
          <div>
            <label className="flex items-center mb-2">
              <input
                type="checkbox"
                checked={timeTba}
                onChange={(e) => setTimeTba(e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm font-medium">Time TBA</span>
            </label>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Location</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full p-2 border rounded-lg"
              placeholder="Event location"
              disabled={venueTba}
            />
            <label className="flex items-center mt-1">
              <input
                type="checkbox"
                checked={venueTba}
                onChange={(e) => setVenueTba(e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm">Venue TBA</span>
            </label>
          </div>
            <div>
            <label className="block text-sm font-medium mb-1">Event Type</label>
            <select
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
              className="w-full p-2 border rounded-lg"
            >
              <option value="offline">Offline</option>
              <option value="virtual">Virtual</option>
            </select>
          </div>
          
          <div>
            <label className="flex items-center mb-2">
              <input
                type="checkbox"
                checked={isPaid}
                onChange={(e) => setIsPaid(e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm font-medium">Paid Event</span>
            </label>
            {isPaid && (
              <div>
                <label className="block text-sm font-medium mb-1">Price (₹)</label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full p-2 border rounded-lg"
                  placeholder="Enter price"
                  min="0"
                />
              </div>
            )}
          </div>
            <div className="space-y-2">
            <button
              onClick={generateImageUrl}
              className="w-full bg-rose-600 text-white py-2 px-4 rounded-lg hover:bg-rose-700"
            >
              Generate Preview
            </button>
            
            <button
              onClick={testAPI}
              className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700"
            >
              Run API Tests
            </button>
          </div>

          <div className="mt-4">
            <h3 className="text-sm font-medium mb-2">Quick Test Cases</h3>            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => loadTestCase('long-title')}
                className="p-2 bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
              >
                Long Title
              </button>
              <button
                onClick={() => loadTestCase('special-chars')}
                className="p-2 bg-green-100 text-green-800 rounded hover:bg-green-200"
              >
                Special Chars
              </button>
              <button
                onClick={() => loadTestCase('all-tba')}
                className="p-2 bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200"
              >
                All TBA
              </button>
              <button
                onClick={() => loadTestCase('virtual')}
                className="p-2 bg-purple-100 text-purple-800 rounded hover:bg-purple-200"
              >
                Virtual Event
              </button>
              <button
                onClick={() => loadTestCase('paid-event')}
                className="p-2 bg-orange-100 text-orange-800 rounded hover:bg-orange-200"
              >
                Paid Event
              </button>
              <button
                onClick={() => loadTestCase('free-event')}
                className="p-2 bg-cyan-100 text-cyan-800 rounded hover:bg-cyan-200"
              >
                Free Event
              </button>
            </div>
          </div>
          
          {imageUrl && (
            <div className="mt-4">
              <label className="block text-sm font-medium mb-1">Generated URL</label>
              <textarea
                value={imageUrl}
                readOnly
                className="w-full p-2 border rounded-lg text-xs"
                rows={3}
              />
              <button
                onClick={() => navigator.clipboard.writeText(imageUrl)}
                className="mt-1 text-sm text-rose-600 hover:underline"
              >
                Copy URL
              </button>
            </div>
          )}
        </div>
        
        <div>
          <h2 className="text-xl font-semibold mb-4">Preview</h2>
          {imageUrl && (
            <div className="border rounded-lg overflow-hidden">
              <img
                src={imageUrl}
                alt="OpenGraph Preview"
                className="w-full h-auto"
                style={{ aspectRatio: '1200/630' }}
                onError={(e) => {
                  console.error('Failed to load image:', imageUrl);
                  e.currentTarget.style.display = 'none';
                }}
                onLoad={() => console.log('Image loaded successfully:', imageUrl)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
