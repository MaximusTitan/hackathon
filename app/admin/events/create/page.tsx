"use client";

import { useState } from "react";
import Link from "next/link";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export default function CreateEvent() {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    location: "",
    capacity: "",
    ticketPrice: "0.00",
    isPublished: false
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    // Handle checkbox inputs
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
      return;
    }
    
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // This would connect to your backend to create the event
    console.log("Event data to be submitted:", formData);
    alert("Event created successfully! (This is a placeholder - would save to database in production)");
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Create New Event</h1>
        <p className="text-gray-600">Fill in the details to create your new event</p>
      </header>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <Label htmlFor="title" className="text-gray-700 font-medium mb-1 block">
              Event Title*
            </Label>
            <Input
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., Annual Tech Conference"
              required
              className="w-full rounded-lg border-2 border-gray-200 py-2 px-4 bg-white/80 
                focus:border-rose-500 focus:ring focus:ring-rose-200"
            />
          </div>
          
          <div>
            <Label htmlFor="date" className="text-gray-700 font-medium mb-1 block">
              Event Date*
            </Label>
            <Input
              id="date"
              name="date"
              type="date"
              value={formData.date}
              onChange={handleChange}
              required
              className="w-full rounded-lg border-2 border-gray-200 py-2 px-4 bg-white/80 
                focus:border-rose-500 focus:ring focus:ring-rose-200"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <Label htmlFor="time" className="text-gray-700 font-medium mb-1 block">
              Start Time*
            </Label>
            <Input
              id="time"
              name="time"
              type="time"
              value={formData.time}
              onChange={handleChange}
              required
              className="w-full rounded-lg border-2 border-gray-200 py-2 px-4 bg-white/80 
                focus:border-rose-500 focus:ring focus:ring-rose-200"
            />
          </div>
          
          <div>
            <Label htmlFor="location" className="text-gray-700 font-medium mb-1 block">
              Location*
            </Label>
            <Input
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="e.g., Convention Center, San Francisco"
              required
              className="w-full rounded-lg border-2 border-gray-200 py-2 px-4 bg-white/80 
                focus:border-rose-500 focus:ring focus:ring-rose-200"
            />
          </div>
        </div>

        <div className="mb-6">
          <Label htmlFor="description" className="text-gray-700 font-medium mb-1 block">
            Event Description*
          </Label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Provide a detailed description of your event..."
            required
            rows={5}
            className="w-full rounded-lg border-2 border-gray-200 py-2 px-4 bg-white/80 
              focus:border-rose-500 focus:ring focus:ring-rose-200"
          ></textarea>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <Label htmlFor="capacity" className="text-gray-700 font-medium mb-1 block">
              Capacity
            </Label>
            <Input
              id="capacity"
              name="capacity"
              type="number"
              min="1"
              value={formData.capacity}
              onChange={handleChange}
              placeholder="Maximum number of attendees"
              className="w-full rounded-lg border-2 border-gray-200 py-2 px-4 bg-white/80 
                focus:border-rose-500 focus:ring focus:ring-rose-200"
            />
          </div>
          
          <div>
            <Label htmlFor="ticketPrice" className="text-gray-700 font-medium mb-1 block">
              Ticket Price ($)
            </Label>
            <Input
              id="ticketPrice"
              name="ticketPrice"
              type="number"
              min="0"
              step="0.01"
              value={formData.ticketPrice}
              onChange={handleChange}
              placeholder="0.00 for free events"
              className="w-full rounded-lg border-2 border-gray-200 py-2 px-4 bg-white/80 
                focus:border-rose-500 focus:ring focus:ring-rose-200"
            />
            <p className="text-sm text-gray-500 mt-1">Leave as 0.00 for free events</p>
          </div>
        </div>

        <div className="mb-6">
          <label className="flex items-center">
            <input
              type="checkbox"
              name="isPublished"
              checked={formData.isPublished}
              onChange={handleChange}
              className="h-5 w-5 rounded border-gray-300 focus:ring-rose-500 text-rose-600"
            />
            <span className="ml-2 text-gray-700">Publish immediately</span>
          </label>
          <p className="text-sm text-gray-500 mt-1">If unchecked, event will be saved as draft</p>
        </div>

        <div className="flex items-center justify-end space-x-4 mt-8">
          <Link
            href="/admin/dashboard"
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            className="bg-rose-600 text-white py-2 px-6 rounded-lg hover:bg-rose-700 transition-colors"
          >
            Create Event
          </button>
        </div>
      </form>
    </div>
  );
}
