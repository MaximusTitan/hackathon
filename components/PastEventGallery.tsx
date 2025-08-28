"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Upload, X, Camera, Trash2, ZoomIn } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/components/providers/auth-provider";
import useSWR from "swr";

type PastEventImage = {
  id: string;
  event_id: string;
  image_url: string;
  caption?: string;
  uploaded_at: string;
};

type PastEventGalleryProps = {
  eventId: string;
  isAdmin?: boolean;
};

export default function PastEventGallery({ eventId, isAdmin = false }: PastEventGalleryProps) {
  const [images, setImages] = useState<PastEventImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [captions, setCaptions] = useState<{ [key: number]: string }>({});
  const { user: currentUser, role } = useAuth();
  const [authChecked, setAuthChecked] = useState(true);
  const [selectedImage, setSelectedImage] = useState<PastEventImage | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Debug: Log when images state changes
  useEffect(() => {
    console.log('Images state updated:', images.length, 'images');
  }, [images]);

  // useAuth already provides user; mark auth as checked

  const fetcher = (url: string) => fetch(url).then(res => res.json());
  const { data: swrData, isLoading, mutate, error: swrError } = useSWR(`/api/events/${eventId}/past-images`, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 5000, // Reduced from 60s to 5s for better responsiveness
    onError: (error) => {
      console.error('SWR error fetching past images:', error);
    },
    onSuccess: (data) => {
      console.log('SWR successfully fetched past images:', data?.images?.length || 0);
    }
  });

  // Sync SWR data with local state when data changes
  useEffect(() => {
    if (swrData?.images) {
      console.log('SWR data received:', swrData.images.length, 'images');
      setImages(swrData.images);
      setLoading(false);
    } else if (!isLoading) {
      console.log('No SWR data, setting loading to false');
      setLoading(false);
    }
  }, [swrData, isLoading]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => 
      file.type.startsWith('image/') && file.size <= 5 * 1024 * 1024 // 5MB limit
    );
    
    if (validFiles.length !== files.length) {
      toast.error("Some files were skipped. Only images under 5MB are allowed.");
    }
    
    setSelectedFiles(prev => [...prev, ...validFiles]);
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setCaptions(prev => {
      const newCaptions = { ...prev };
      delete newCaptions[index];
      return newCaptions;
    });
  };

  // Removed bearer token approach; server routes now use session cookie

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      toast.error("Please select at least one image");
      return;
    }

    // Check if user is authenticated
    if (!currentUser) {
      toast.error("Please log in to upload images");
      return;
    }

    // Check if user is admin
  const userIsAdmin = role === 'admin' || currentUser.email === 'admin@hackon.com';
    if (!userIsAdmin) {
      toast.error("Admin access required to upload images");
      return;
    }

    setUploading(true);
    
    try {
      const formData = new FormData();
      selectedFiles.forEach((file, index) => {
        formData.append(`images`, file);
        formData.append(`caption_${index}`, captions[index] || '');
      });
      formData.append('event_id', eventId);

      console.log('Making upload request for user:', currentUser.email);
      
      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      const response = await fetch(`/api/events/${eventId}/past-images`, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      const responseData = await response.json();
      console.log('Upload response:', response.status, responseData);

      if (response.ok) {
        console.log('Upload successful, response data:', responseData);
        toast.success("Images uploaded successfully!");
        setSelectedFiles([]);
        setCaptions({});
        setShowUploadForm(false);
        
        // If API returns the uploaded images, update local state immediately
        if (responseData.images && Array.isArray(responseData.images)) {
          console.log('Updating local state with', responseData.images.length, 'new images');
          setImages(prev => {
            const newImages = [...prev, ...responseData.images];
            console.log('New images array length:', newImages.length);
            return newImages;
          });
        }
        
        // Refresh data from server to ensure consistency
        mutate();
      } else {
        console.error('Upload error response:', responseData);
        toast.error(responseData.error || "Failed to upload images");
      }
    } catch (error) {
      console.error("Upload error:", error);
      
      if (error instanceof Error && error.name === 'AbortError') {
        toast.error("Upload timed out. Please try again.");
      } else {
        toast.error("Failed to upload images");
      }
    } finally {
      // Always reset uploading state
      setUploading(false);
    }
  };
  const handleDeleteImage = async (imageId: string) => {
    if (!confirm("Are you sure you want to delete this image?")) return;

    // Check if user is authenticated
    if (!currentUser) {
      toast.error("Please log in to delete images");
      return;
    }

    try {
      const response = await fetch(`/api/events/${eventId}/past-images/${imageId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success("Image deleted successfully");
        // Immediately remove from local state
        setImages(prev => prev.filter(img => img.id !== imageId));
        // Refresh data from server to ensure consistency
        mutate();
      } else {
        const error = await response.json();
        console.error('Delete error response:', error);
        toast.error(error.error || "Failed to delete image");
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete image");
    }
  };

  const openImageModal = (image: PastEventImage) => {
    setSelectedImage(image);
    setShowModal(true);
  };

  const closeImageModal = () => {
    setSelectedImage(null);
    setShowModal(false);
  };

  // Handle keyboard navigation in modal
  useEffect(() => {
    if (!showModal) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeImageModal();
      } else if (e.key === 'ArrowLeft') {
        navigateImage('prev');
      } else if (e.key === 'ArrowRight') {
        navigateImage('next');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showModal, selectedImage, images]);

  const navigateImage = (direction: 'prev' | 'next') => {
    if (!selectedImage) return;
    
    const currentIndex = images.findIndex(img => img.id === selectedImage.id);
    let newIndex;
    
    if (direction === 'prev') {
      newIndex = currentIndex > 0 ? currentIndex - 1 : images.length - 1;
    } else {
      newIndex = currentIndex < images.length - 1 ? currentIndex + 1 : 0;
    }
    
    setSelectedImage(images[newIndex]);
  };

  if (isLoading || loading) {
    return (
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Camera className="w-5 h-5 text-rose-600" />
          Past Event Gallery
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="aspect-square bg-gray-200 rounded-lg animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  // Always show gallery if there are images, regardless of login status
  if (images.length === 0 && !isAdmin) {
    return null;
  }

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
          <Camera className="w-5 h-5 text-rose-600" />
          Past Event Gallery
          {images.length > 0 && (
            <span className="text-base text-gray-500 font-normal">({images.length})</span>
          )}
        </h2>
        
        {/* Only show admin controls if isAdmin prop is true AND user is authenticated */}
        {isAdmin && authChecked && (
          <div className="flex items-center gap-2">
            {!currentUser ? (
              <span className="text-sm text-amber-600">Not authenticated</span>
            ) : !(currentUser.user_metadata?.role === 'admin' || currentUser.email === 'admin@hackon.com') ? (
              <span className="text-sm text-amber-600">Admin access required</span>
            ) : null}
            <button
              onClick={() => setShowUploadForm(!showUploadForm)}
              className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!currentUser || !(currentUser.user_metadata?.role === 'admin' || currentUser.email === 'admin@hackon.com')}
            >
              <Upload className="w-4 h-4" />
              Upload Images
            </button>
          </div>
        )}
      </div>

      {/* Show authentication/permission status for debugging - only in development and only for admins */}
      {isAdmin && authChecked && process.env.NODE_ENV === 'development' && (
        <div className="mb-4 text-xs text-gray-500">
          Auth Status: {currentUser ? `Authenticated as ${currentUser.email}` : 'Not authenticated'} | 
          Role: {currentUser?.user_metadata?.role || 'none'} | 
          Admin: {(currentUser?.user_metadata?.role === 'admin' || currentUser?.email === 'admin@hackon.com') ? 'Yes' : 'No'}
        </div>
      )}

      {/* Upload Form - Only show if user is authenticated and admin */}
      {isAdmin && showUploadForm && currentUser && (currentUser.user_metadata?.role === 'admin' || currentUser.email === 'admin@hackon.com') && (
        <div className="bg-gray-50 rounded-lg p-6 mb-6 border border-gray-200">
          <h3 className="text-lg font-medium text-gray-800 mb-4">Upload Past Event Images</h3>
          
          <div className="mb-4">
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              id="image-upload"
            />
            <label
              htmlFor="image-upload"
              className="block w-full p-4 border-2 border-dashed border-gray-300 rounded-lg text-center cursor-pointer hover:border-rose-400"
            >
              <Upload className="w-6 h-6 mx-auto mb-2 text-gray-400" />
              <span className="text-gray-600">Click to select images (max 5MB each)</span>
            </label>
          </div>

          {/* Selected Files Preview */}
          {selectedFiles.length > 0 && (
            <div className="space-y-4 mb-4">
              <h4 className="font-medium text-gray-700">Selected Images:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-white rounded-lg border">
                    <div className="relative w-16 h-16 flex-shrink-0">
                      <Image
                        src={URL.createObjectURL(file)}
                        alt={`Preview ${index + 1}`}
                        fill
                        className="object-cover rounded"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                      <input
                        type="text"
                        placeholder="Add caption (optional)"
                        value={captions[index] || ''}
                        onChange={(e) => setCaptions(prev => ({ ...prev, [index]: e.target.value }))}
                        className="w-full mt-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:border-rose-400"
                      />
                    </div>
                    <button
                      onClick={() => removeSelectedFile(index)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleUpload}
              disabled={uploading || selectedFiles.length === 0}
              className="bg-rose-600 hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium"
            >
              {uploading ? "Uploading..." : "Upload Images"}
            </button>
            <button
              onClick={() => {
                setShowUploadForm(false);
                setSelectedFiles([]);
                setCaptions({});
              }}
              className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Show authentication message if admin interface is enabled but user is not properly authenticated */}
      {isAdmin && authChecked && (!currentUser || !(currentUser.user_metadata?.role === 'admin' || currentUser.email === 'admin@hackon.com')) && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
          <p className="text-amber-800">
            {!currentUser 
              ? "You need to be logged in to manage past event images." 
              : "Admin access required to manage past event images."
            }
          </p>
        </div>
      )}

      {/* Image Gallery - Show to everyone, regardless of auth status */}
      {images.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Camera className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>No past event images available yet.</p>
          {isAdmin && currentUser && (currentUser.user_metadata?.role === 'admin' || currentUser.email === 'admin@hackon.com') && (
            <p className="text-sm mt-1">Upload some images to showcase this event!</p>
          )}
        </div>
      ) : (        <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
          {images.map((image) => (
            <div key={image.id} className="group relative break-inside-avoid mb-4">
              <div className="relative overflow-hidden rounded-lg cursor-pointer" onClick={() => openImageModal(image)}>
                <Image
                  src={image.image_url}
                  alt={image.caption || "Past event image"}
                  width={400}
                  height={300}
                  className="w-full h-auto object-cover hover:scale-105 transition-transform duration-200"
                  loading="lazy"
                  sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  onError={(e) => {
                    console.error('Image failed to load:', image.image_url);
                    // Hide broken images gracefully
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
                
                {/* Zoom overlay icon */}
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                  <ZoomIn className="w-8 h-8 text-white" />
                </div>
                
                {/* Caption Overlay - Show to everyone */}
                {image.caption && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3 rounded-b-lg">
                    <p className="text-white text-sm">{image.caption}</p>
                  </div>
                )}
                
                {/* Admin Delete Button - Only show to authenticated admins */}
                {isAdmin && currentUser && (currentUser.user_metadata?.role === 'admin' || currentUser.email === 'admin@hackon.com') && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteImage(image.id);
                    }}
                    className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          ))}        </div>
      )}      {/* Full Screen Image Modal */}
      {showModal && selectedImage && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
          {/* Close button */}
          <button
            onClick={closeImageModal}
            className="absolute top-4 right-4 text-white hover:text-gray-300 bg-black/50 rounded-full p-2 z-20"
          >
            <X className="w-6 h-6" />
          </button>
          
          {/* Navigation buttons */}
          {images.length > 1 && (
            <>
              <button
                onClick={() => navigateImage('prev')}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 bg-black/50 rounded-full p-2 z-20"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={() => navigateImage('next')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 bg-black/50 rounded-full p-2 z-20"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}
          
          {/* Image counter */}
          {images.length > 1 && (
            <div className="absolute top-4 left-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm z-20">
              {images.findIndex(img => img.id === selectedImage.id) + 1} / {images.length}
            </div>
          )}
          
          {/* Main image container */}
          <div className="relative w-full h-full flex items-center justify-center">
            <div className="relative max-w-[calc(100vw-8rem)] max-h-[calc(100vh-8rem)] flex items-center justify-center">
              <Image
                src={selectedImage.image_url}
                alt={selectedImage.caption || "Past event image"}
                width={1200}
                height={800}
                className="max-w-full max-h-full object-contain"
                sizes="(max-width: 768px) calc(100vw - 2rem), calc(100vw - 8rem)"
                style={{ width: 'auto', height: 'auto' }}
              />
            </div>
            
            {/* Image caption */}
            {selectedImage.caption && (
              <div className="absolute bottom-4 left-4 right-4 bg-black/80 text-white p-4 rounded-lg">
                <p className="text-center text-lg">{selectedImage.caption}</p>
              </div>
            )}
          </div>
          
          {/* Click outside to close */}
          <div
            className="absolute inset-0 -z-10"
            onClick={closeImageModal}
          />
        </div>
      )}
    </div>
  );
}
