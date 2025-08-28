"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

export default function AuthRefreshHandler() {
  const searchParams = useSearchParams();
  const refresh = searchParams.get("refresh");

  useEffect(() => {
    if (refresh === "true") {
      // Remove the refresh parameter from the URL
      const url = new URL(window.location.href);
      url.searchParams.delete("refresh");
      window.history.replaceState({}, "", url.toString());

      // Refresh the page to ensure all components update with new auth state
      window.location.reload();
    }
  }, [refresh]);

  return null; // This component doesn't render anything
}
