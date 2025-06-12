"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

type RecruitingPartner = {
  id: string;
  event_id: string;
  name: string;
  logo_url: string;
  website_url: string;
};

interface EventRecruitingPartnersProps {
  eventId: string;
}

export default function EventRecruitingPartners({ eventId }: EventRecruitingPartnersProps) {
  const [recruitingCompanies, setRecruitingCompanies] = useState<RecruitingPartner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPartners = async () => {
      try {
        const res = await fetch(`/api/recruiting-partners?eventId=${eventId}`);
        if (res.ok) {
          const data = await res.json();
          setRecruitingCompanies(data.partners || []);
        }
      } catch (error) {
        console.error('Error fetching recruiting partners:', error);
      } finally {
        setLoading(false);
      }
    };

    if (eventId) {
      fetchPartners();
    }
  }, [eventId]);

  // Don't render anything if no partners or still loading
  if (loading || recruitingCompanies.length === 0) {
    return null;
  }
  return (
    <div className="mb-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-100">
      <div className="mb-3">        <h3 className="text-lg font-semibold text-gray-800 mb-1">
          🚀 Recruiting Partners
        </h3>
        <p className="text-gray-600 text-xs">
          Connect with top companies looking for talented developers
        </p>
      </div>      <div className="flex flex-wrap items-center gap-3">
        {recruitingCompanies.map((company) => (
          <a
            key={company.id}
            href={company.website_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center p-2 bg-white rounded-md shadow-sm hover:shadow-md transition-shadow duration-200 border border-gray-100 cursor-pointer"
          >
            <Image
              src={company.logo_url}
              alt={`${company.name} Logo`}
              width={80}
              height={32}
              className="object-contain max-h-6"
              style={{ objectFit: 'contain' }}
            />
          </a>
        ))}
      </div>
      
      <div className="mt-3">
        <p className="text-xs text-gray-500">
          Participants may be contacted by our recruiting partners for career opportunities
        </p>
      </div>
    </div>
  );
}
