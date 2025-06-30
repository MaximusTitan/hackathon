import React from "react";

interface FacepileProps {
  participants: Array<{
    id: string;
    user_name: string | null;
    photo_url?: string | null;
  }>;
  maxVisible?: number;
  size?: "sm" | "md" | "lg";
  showCount?: boolean;
  totalCount?: number; // Add custom total count prop
}

export function Facepile({ 
  participants, 
  maxVisible = 3, 
  size = "sm", 
  showCount = true,
  totalCount 
}: FacepileProps) {
  const sizeClasses = {
    sm: "w-6 h-6 text-xs",
    md: "w-8 h-8 text-sm", 
    lg: "w-10 h-10 text-base"
  };

  const visibleParticipants = participants.slice(0, maxVisible);
  const actualTotalCount = totalCount ?? participants.length;
  const remainingCount = Math.max(0, actualTotalCount - maxVisible);

  if (actualTotalCount === 0) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex">
          <div className={`${sizeClasses[size]} rounded-full bg-gray-100 flex items-center justify-center border-2 border-white`}>
            <span className="text-gray-400 font-medium">0</span>
          </div>
        </div>
        {showCount && (
          <span className="text-sm text-gray-500">No participants yet</span>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex -space-x-1">
        {visibleParticipants.map((participant, index) => (
          <div
            key={participant.id}
            className={`${sizeClasses[size]} rounded-full border-2 border-white bg-gray-100 flex items-center justify-center overflow-hidden`}
            style={{ zIndex: maxVisible - index }}
            title={participant.user_name || "Participant"}
          >
            {participant.photo_url ? (
              <img
                src={participant.photo_url}
                alt={participant.user_name || "Participant"}
                className={`${sizeClasses[size]} rounded-full object-cover`}
              />
            ) : (
              <span className="text-gray-600 font-medium">
                {participant.user_name?.charAt(0).toUpperCase() || "?"}
              </span>
            )}
          </div>
        ))}
        
        {remainingCount > 0 && (
          <div
            className={`${sizeClasses[size]} rounded-full border-2 border-white bg-gray-200 flex items-center justify-center`}
            style={{ zIndex: 0 }}
          >
            <span className="text-gray-600 font-medium">
              +{remainingCount}
            </span>
          </div>
        )}
      </div>
      
      {showCount && (
        <span className="text-sm text-gray-600">
          {actualTotalCount} participant{actualTotalCount === 1 ? "" : "s"}
        </span>
      )}
    </div>
  );
}
