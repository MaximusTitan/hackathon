export function AdminEventCardSkeleton() {
  return (
    <div className="w-full bg-white rounded-3xl shadow-lg border border-gray-100 flex flex-col md:flex-row overflow-hidden h-96 md:h-80 animate-pulse">
      {/* Action buttons skeleton */}
      <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
        <div className="w-9 h-9 bg-gray-200 rounded"></div>
        <div className="w-9 h-9 bg-gray-200 rounded"></div>
      </div>

      <div className="md:w-2/5 w-full h-80 md:h-full relative flex-shrink-0 bg-gray-200">
        <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300"></div>
      </div>
      
      <div className="flex-1 p-8 flex flex-col justify-between bg-white min-h-0">
        <div className="flex-1 overflow-hidden">
          <div className="space-y-3">
            {/* Title and badges skeleton */}
            <div className="flex items-center gap-3">
              <div className="h-8 bg-gray-200 rounded-lg w-2/3"></div>
              <div className="h-6 bg-gray-200 rounded-full w-16"></div>
            </div>
            
            {/* Price skeleton */}
            <div className="h-6 bg-gray-200 rounded w-20"></div>
            
            {/* Date and time badges skeleton */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="h-8 bg-gray-200 rounded-full w-32"></div>
              <div className="h-8 bg-gray-200 rounded-full w-28"></div>
            </div>

            {/* Location skeleton */}
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-40"></div>
            </div>

            {/* Toggle skeleton */}
            <div className="flex items-center gap-3">
              <div className="h-6 w-10 bg-gray-200 rounded-full"></div>
              <div className="h-4 bg-gray-200 rounded w-16"></div>
            </div>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center justify-between gap-3 mt-4">
          {/* Button skeletons */}
          <div className="h-12 bg-gray-200 rounded-lg w-32"></div>
          <div className="h-12 bg-gray-200 rounded-lg w-32"></div>
        </div>
      </div>
    </div>
  );
}
