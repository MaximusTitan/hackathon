"use client";

import { useCallback, useState } from "react";
import Image from "next/image";
import { CalendarIcon, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { TiptapEditor } from "@/components/ui/tiptap-editor";

type Event = {
  id: string;
  title: string;
  description?: string | null;
  start_date: string;
  end_date: string;
  start_time: string;
  end_time: string;
  event_type: "virtual" | "offline";
  event_category?: "hackathon" | "sales";
  meeting_link?: string | null;
  location?: string | null;
  location_link?: string | null;
  venue_name?: string | null;
  address_line1?: string | null;
  city?: string | null;
  postal_code?: string | null;
  image_url: string | null;
  is_public: boolean;
  is_paid: boolean;
  price: number;
  razorpay_key_id?: string;
  created_at: string;
  time_tba?: boolean;
  venue_tba?: boolean;
  project_instructions?: string | null;
};

interface AdminEventFormProps {
  form: {
    title: string;
    description: string;
    start_date: string;
    end_date: string;
    start_time: string;
    end_time: string;
    event_type: "virtual" | "offline";
    event_category: "hackathon" | "sales";
    meeting_link: string;
    location: string;
    location_link: string;
    venue_name: string;
    address_line1: string;
    city: string;
    postal_code: string;
    image_url: string;
    is_public: boolean;
    is_paid: boolean;
    price: number;
    razorpay_key_id: string;
    date_tba: boolean;
    time_tba: boolean;
    venue_tba: boolean;
    project_instructions: string;
  };
  setForm: (form: any) => void;
  startDateObj: Date | undefined;
  setStartDateObj: (date: Date | undefined) => void;
  endDateObj: Date | undefined;
  setEndDateObj: (date: Date | undefined) => void;
  imageFile: File | null;
  setImageFile: (file: File | null) => void;
  imagePreview: string | null;
  setImagePreview: (preview: string | null) => void;
  isEditing: boolean;
  editingEvent: Event | null;
  creating: boolean;  uploading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  onImageChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onImageUrlChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function AdminEventForm({
  form,
  setForm,
  startDateObj,
  setStartDateObj,
  endDateObj,
  setEndDateObj,
  imageFile,
  setImageFile,
  imagePreview,
  setImagePreview,
  isEditing,
  editingEvent,
  creating,
  uploading,
  onSubmit,
  onCancel,
  onImageChange,
  onImageUrlChange
}: AdminEventFormProps) {
  const [titleError, setTitleError] = useState<string>("");
  const [checkingTitle, setCheckingTitle] = useState(false);

  // Function to check if title already exists
  const checkTitleUniqueness = useCallback(async (title: string) => {
    if (!title.trim() || title === editingEvent?.title) {
      setTitleError("");
      return;
    }

    setCheckingTitle(true);
    try {
      const response = await fetch(`/api/events/check-title?title=${encodeURIComponent(title.trim())}`);
      const data = await response.json();
      
      if (data.exists) {
        setTitleError("An event with this title already exists. Please choose a different title.");
      } else {
        setTitleError("");
      }
    } catch (error) {
      console.error("Error checking title:", error);
      // Don't show error to user for network issues
      setTitleError("");
    } finally {
      setCheckingTitle(false);
    }
  }, [editingEvent?.title]);

  // Debounced title change handler
  const handleTitleChange = useCallback((title: string) => {
    setForm((f: any) => ({ ...f, title }));
    
    // Clear previous error immediately
    setTitleError("");
    
    // Debounce the title check
    const timeoutId = setTimeout(() => {
      checkTitleUniqueness(title);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [setForm, checkTitleUniqueness]);
  const handleImageChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (onImageChange) {
      onImageChange(e);
    } else {
      // Default behavior
      if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
        setForm((f: any) => ({ ...f, image_url: "" }));
      }
    }
  }, [onImageChange, setImageFile, setImagePreview, setForm]);

  const handleImageUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onImageUrlChange) {
      onImageUrlChange(e);
    } else {
      // Default behavior
      const url = e.target.value;
      setForm((f: any) => ({ ...f, image_url: url }));
      if (url) {
        setImageFile(null);
        setImagePreview(null);
        const fileInput = document.getElementById('image') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      }
    }
  };

  // Clear/remove currently selected image (file or URL)
  const handleRemoveImage = useCallback(() => {
    setImageFile(null);
    setImagePreview(null);
    setForm((f: any) => ({ ...f, image_url: "" }));
    const fileInput = document.getElementById('image') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  }, [setForm, setImageFile, setImagePreview]);

  return (
    <Card className="mb-8 bg-white">
      <CardHeader>
        <CardTitle className="text-gray-800">
          {isEditing ? "Edit Event" : "Create New Event"}
        </CardTitle>
        <CardDescription className="text-gray-600">
          {isEditing ? "Update event details" : "Fill out the form to create a new event"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-6">
          <div className="grid gap-4">            {/* Event Title */}
            <div className="grid gap-2">
              <Label htmlFor="title" className="text-gray-700">
                Event Title
              </Label>
              <div className="relative">
                <Input
                  id="title"
                  placeholder="Enter event title"
                  value={form.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  required
                  className={`border-gray-200 text-gray-900 placeholder:text-gray-500 bg-white ${
                    titleError ? 'border-red-500 focus:border-red-500' : ''
                  }`}
                />
                {checkingTitle && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  </div>
                )}
              </div>
              {titleError && (
                <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                  <span className="text-red-500">⚠</span>
                  {titleError}
                </p>
              )}
              <p className="text-gray-500 text-xs">
                Event titles must be unique. This will be used to generate the event URL.
              </p>
            </div>

            {/* Date TBA Toggle */}
            <div className="flex items-center gap-3 mb-4">
              <Switch
                checked={form.date_tba}
                onCheckedChange={(checked) => setForm((f: any) => ({ ...f, date_tba: checked }))}
              />
              <Label className="text-gray-700 font-medium">
                Date To Be Announced (TBA)
              </Label>
            </div>

            {/* Date Fields - Only show if not TBA */}
            {!form.date_tba ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Start Date */}
                <div className="grid gap-2">
                  <Label className="text-gray-700">Start Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal bg-white border-gray-200 text-gray-800",
                          !startDateObj && "text-gray-500"
                        )}
                        type="button"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4 text-gray-500" />
                        {startDateObj
                          ? format(startDateObj, "PPP")
                          : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-white" align="start">
                      <Calendar
                        mode="single"
                        selected={startDateObj}
                        onSelect={(d) => {
                          setStartDateObj(d);
                          setForm((f: any) => ({
                            ...f,
                            start_date: d ? d.toISOString().slice(0, 10) : "",
                          }));
                        }}
                        initialFocus
                        className="bg-white text-gray-900"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                {/* End Date */}
                <div className="grid gap-2">
                  <Label className="text-gray-700">End Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal bg-white border-gray-200 text-gray-800",
                          !endDateObj && "text-gray-500"
                        )}
                        type="button"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4 text-gray-500" />
                        {endDateObj
                          ? format(endDateObj, "PPP")
                          : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-white" align="start">
                      <Calendar
                        mode="single"
                        selected={endDateObj}
                        onSelect={(d) => {
                          setEndDateObj(d);
                          setForm((f: any) => ({
                            ...f,
                            end_date: d ? d.toISOString().slice(0, 10) : "",
                          }));
                        }}
                        initialFocus
                        className="bg-white text-gray-900"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            ) : (
              <div className="grid gap-2">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-blue-800 font-medium">📅 Event date will be announced later</p>
                  <p className="text-blue-600 text-sm mt-1">Event attendees will be notified once the date is confirmed.</p>
                </div>
              </div>
            )}

            {/* Time TBA Toggle */}
            <div className="flex items-center gap-3 mb-4">
              <Switch
                checked={form.time_tba}
                onCheckedChange={(checked) => setForm((f: any) => ({ ...f, time_tba: checked }))}
              />
              <Label className="text-gray-700 font-medium">
                Time To Be Announced (TBA)
              </Label>
            </div>

            {/* Time Fields - Only show if not TBA */}
            {!form.time_tba && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="start_time" className="text-gray-700">
                    Start Time
                  </Label>
                  <div className="flex items-center">
                    <Clock className="mr-2 h-4 w-4 text-gray-500" />
                    <Input
                      id="start_time"
                      type="time"
                      value={form.start_time}
                      onChange={(e) => setForm((f: any) => ({ ...f, start_time: e.target.value }))}
                      required={!form.time_tba}
                      className="border-gray-200 text-gray-900 bg-white"
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="end_time" className="text-gray-700">
                    End Time
                  </Label>
                  <div className="flex items-center">
                    <Clock className="mr-2 h-4 w-4 text-gray-500" />
                    <Input
                      id="end_time"
                      type="time"
                      value={form.end_time}
                      onChange={(e) => setForm((f: any) => ({ ...f, end_time: e.target.value }))}
                      required={!form.time_tba}
                      className="border-gray-200 text-gray-900 bg-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Event Type */}
            <div className="grid gap-2">
              <Label htmlFor="event_type" className="text-gray-700">
                Event Type
              </Label>
              <Select
                value={form.event_type}
                onValueChange={(value) => setForm((f: any) => ({ ...f, event_type: value as "virtual" | "offline" }))}
              >
                <SelectTrigger className="bg-white border-gray-200 text-gray-900">
                  <SelectValue placeholder="Select event type" />
                </SelectTrigger>
                <SelectContent className="bg-white text-gray-900">
                  <SelectItem value="offline">Offline</SelectItem>
                  <SelectItem value="virtual">Virtual</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Event Category */}
            <div className="grid gap-2">
              <Label htmlFor="event_category" className="text-gray-700">
                Event Category
              </Label>
              <Select
                value={form.event_category}
                onValueChange={(value) => setForm((f: any) => ({ ...f, event_category: value as "hackathon" | "sales" }))}
              >
                <SelectTrigger className="bg-white border-gray-200 text-gray-900">
                  <SelectValue placeholder="Select event category" />
                </SelectTrigger>
                <SelectContent className="bg-white text-gray-900">
                  <SelectItem value="hackathon">Hackathon</SelectItem>
                  <SelectItem value="sales">Sales Event</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-gray-500 text-xs">
                {form.event_category === "hackathon" 
                  ? "Participants will submit GitHub repos, deployment links, and presentations" 
                  : "Participants will submit video presentations and sales pitch materials"}
              </p>
            </div>

            {/* Venue TBA Toggle - Only show for offline events */}
            {form.event_type === "offline" && (
              <div className="flex items-center gap-3 mb-4">
                <Switch
                  checked={form.venue_tba}
                  onCheckedChange={(checked) => setForm((f: any) => ({ ...f, venue_tba: checked }))}
                />
                <Label className="text-gray-700 font-medium">
                  Venue To Be Announced (TBA)
                </Label>
              </div>
            )}

            {/* Conditional Location/Meeting Fields */}
            {form.event_type === "virtual" ? (
              <div className="grid gap-2">
                <Label htmlFor="meeting_link" className="text-gray-700">
                  Meeting Link
                </Label>
                <Input
                  id="meeting_link"
                  placeholder="Enter meeting URL"
                  value={form.meeting_link}
                  onChange={(e) => setForm((f: any) => ({ ...f, meeting_link: e.target.value }))}
                  required
                  className="border-gray-200 text-gray-900 placeholder:text-gray-500 bg-white"
                />
              </div>
            ) : !form.venue_tba ? (
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="venue_name" className="text-gray-700">
                    Venue Name
                  </Label>
                  <Input
                    id="venue_name"
                    placeholder="Enter venue name"
                    value={form.venue_name}
                    onChange={(e) => setForm((f: any) => ({ ...f, venue_name: e.target.value }))}
                    required={!form.venue_tba}
                    className="border-gray-200 text-gray-900 placeholder:text-gray-500 bg-white"
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="address_line1" className="text-gray-700">
                    Address
                  </Label>
                  <Input
                    id="address_line1"
                    placeholder="Enter street address"
                    value={form.address_line1}
                    onChange={(e) => setForm((f: any) => ({ ...f, address_line1: e.target.value }))}
                    required={!form.venue_tba}
                    className="border-gray-200 text-gray-900 placeholder:text-gray-500 bg-white"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="city" className="text-gray-700">
                      City
                    </Label>
                    <Input
                      id="city"
                      placeholder="Enter city"
                      value={form.city}
                      onChange={(e) => setForm((f: any) => ({ ...f, city: e.target.value }))}
                      required={!form.venue_tba}
                      className="border-gray-200 text-gray-900 placeholder:text-gray-500 bg-white"
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="postal_code" className="text-gray-700">
                      Postal Code
                    </Label>
                    <Input
                      id="postal_code"
                      placeholder="Enter postal code"
                      value={form.postal_code}
                      onChange={(e) => setForm((f: any) => ({ ...f, postal_code: e.target.value }))}
                      className="border-gray-200 text-gray-900 placeholder:text-gray-500 bg-white"
                    />
                  </div>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="location" className="text-gray-700">
                    Location Display Text
                  </Label>
                  <Input
                    id="location"
                    placeholder="How location should display to users"
                    value={form.location}
                    onChange={(e) => setForm((f: any) => ({ ...f, location: e.target.value }))}
                    required={!form.venue_tba}
                    className="border-gray-200 text-gray-900 placeholder:text-gray-500 bg-white"
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="location_link" className="text-gray-700">
                    Location Link (Google Maps URL)
                  </Label>
                  <Input
                    id="location_link"
                    placeholder="Enter Google Maps or location URL"
                    value={form.location_link}
                    onChange={(e) => setForm((f: any) => ({ ...f, location_link: e.target.value }))}
                    className="border-gray-200 text-gray-900 placeholder:text-gray-500 bg-white"
                  />
                </div>
              </div>
            ) : (
              <div className="grid gap-2">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-blue-800 font-medium">📍 Venue details will be announced later</p>
                  <p className="text-blue-600 text-sm mt-1">Event attendees will be notified once venue information is available.</p>
                </div>
              </div>
            )}

            {/* Description */}
            <div className="grid gap-2">
              <Label htmlFor="description" className="text-gray-700">
                Description
              </Label>
              <TiptapEditor
                content={form.description || ""}
                onChange={(content) => setForm((f: any) => ({ ...f, description: content }))}
                placeholder="Enter event description..."
                toolbar={{
                  bold: true,
                  italic: true,
                  underline: true,
                  bulletList: true,
                  orderedList: true,
                  heading: {
                    h1: true,
                    h2: true,
                    h3: true
                  },
                  link: true,
                  undo: true,
                  redo: true
                }}
              />
            </div>

            {/* Project Instructions */}
            <div className="grid gap-2">
              <Label htmlFor="project_instructions" className="text-gray-700">
                {form.event_category === "sales" ? "Sales Challenge Instructions" : "Project Instructions"}
              </Label>
              <TiptapEditor
                content={form.project_instructions || ""}
                onChange={(content) => setForm((f: any) => ({ ...f, project_instructions: content }))}
                placeholder={
                  form.event_category === "sales" 
                    ? "Enter instructions for the sales challenge, submission guidelines, and evaluation criteria..."
                    : "Enter project instructions for participants who pass the screening test..."
                }
                toolbar={{
                  bold: true,
                  italic: true,
                  underline: true,
                  bulletList: true,
                  orderedList: true,
                  heading: {
                    h1: true,
                    h2: true,
                    h3: true
                  },
                  link: true,
                  undo: true,
                  redo: true
                }}
              />
              <p className="text-gray-500 text-xs">
                {form.event_category === "sales" 
                  ? "These instructions will guide participants on how to create and submit their sales presentations and videos."
                  : "These instructions will be shown to participants after they pass the screening test or if screening is skipped."}
              </p>
            </div>

            {/* Image Upload */}
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="image" className="text-gray-700">
                  Event Image
                </Label>
                <div className="space-y-2">
                  <Input
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="border-gray-200"
                    disabled={uploading || !!form.image_url}
                  />
                  {uploading && (
                    <p className="text-sm text-gray-500">Uploading image…</p>
                  )}
                  {(imagePreview || form.image_url) && (
                    <div className="mt-2">
                      <div className="relative w-full max-w-md">
                        <Image
                          src={imagePreview || form.image_url}
                          alt="Selected image preview"
                          width={400}
                          height={300}
                          className="w-full rounded-lg object-cover border border-gray-200"
                          // Use unoptimized for blob/data URLs or external preview safety
                          unoptimized={
                            !!imagePreview || (!!form.image_url && (form.image_url.startsWith('blob:') || form.image_url.startsWith('data:')))
                          }
                        />
                        <div className="mt-2 flex gap-2">
                          <Button type="button" variant="secondary" className="text-rose-600 border-rose-200 hover:bg-rose-50" onClick={handleRemoveImage}>
                            Remove image
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="image_url" className="text-gray-700">
                  Or Image URL
                </Label>
                <Input
                  id="image_url"
                  placeholder="Enter image URL"
                  value={form.image_url}
                  onChange={handleImageUrlChange}
                  className="border-gray-200"
                  disabled={uploading || !!imageFile}
                />
                {form.image_url && (
                  <div>
                    <Button type="button" variant="secondary" className="text-rose-600 border-rose-200 hover:bg-rose-50" onClick={handleRemoveImage}>
                      Clear URL
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Event Visibility */}
            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="is-public" className="text-gray-700">
                Event Visibility
              </Label>
              <div className="flex items-center space-x-2">
                <Switch
                  id="is-public"
                  checked={form.is_public}
                  onCheckedChange={(checked) => 
                    setForm((f: any) => ({ ...f, is_public: checked }))
                  }
                />
                <span className="text-sm text-gray-600">
                  {form.is_public ? "Public" : "Private"}
                </span>
              </div>
            </div>

            {/* Payment Settings */}
            <div className="space-y-4 border-t pt-4">
              <h3 className="text-lg font-semibold text-gray-800">
                Payment Settings
              </h3>
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="is-paid" className="text-gray-700">
                  Event Type
                </Label>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is-paid"
                    checked={form.is_paid}
                    onCheckedChange={(checked) => 
                      setForm((f: any) => ({ ...f, is_paid: checked }))
                    }
                  />
                  <span className="text-sm text-gray-600">
                    {form.is_paid ? "Paid Event" : "Free Event"}
                  </span>
                </div>
              </div>
              {form.is_paid && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="price" className="text-gray-700">
                      Registration Fee (₹)
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                      <Input
                        id="price"
                        type="number"
                        min="1"
                        value={form.price}
                        onChange={(e) => setForm((f: any) => ({ 
                          ...f, 
                          price: parseInt(e.target.value) || 0 
                        }))}
                        className="pl-8 border-gray-200 text-gray-900 placeholder:text-gray-500 bg-white"
                        placeholder="Enter amount"
                        required
                      />
                    </div>
                  </div>
                </div>
              )}
              <div className="text-sm text-gray-500">
                {form.is_paid 
                  ? "Users will need to pay the registration fee to attend this event"
                  : "This event is free for all users to attend"}
              </div>
            </div>
          </div>          <div className="flex gap-2">
            <Button
              type="submit"
              disabled={creating || uploading || !!titleError || checkingTitle}
              className="bg-rose-600 hover:bg-rose-700 text-white flex-1 disabled:opacity-50"
            >
              {creating ? "Saving..." : isEditing ? "Update Event" : "Create Event"}
            </Button>
            {isEditing && (
              <Button
                type="button"
                onClick={onCancel}
                className="bg-gray-500 hover:bg-gray-600 text-white"
              >
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
