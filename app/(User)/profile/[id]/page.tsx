"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Github, Linkedin, Mail, Phone, Briefcase, GraduationCap, Code, Trophy } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

type Profile = {
  id: string;
  name: string;
  email: string;
  linkedin: string | null;
  contact_number?: string | null;
  github?: string | null;
  education?: string | null;
  years_of_experience?: string | null;
  programming_languages?: string | null;
  expertise?: string | null;
  photo_url?: string | null;
  role?: string | null;
  created_at: string;
};

export default function UserProfilePage() {
  const params = useParams();
  const userId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function fetchData() {
      try {
        // Check if current user is admin
        const authRes = await fetch('/api/auth/check');
        const authData = await authRes.json();
        setIsAdmin(authData.user?.user_metadata?.role === 'admin');

        // Fetch profile data
        const profileRes = await fetch(`/api/user/profile/${userId}`);
        const data = await profileRes.json();
        
        if (profileRes.ok && data.profile) {
          setProfile(data.profile);
        } else {
          setError(data.error || "Profile not found");
          toast.error("Failed to load profile");
        }
      } catch (err) {
        setError("Failed to load profile");
        toast.error("Error loading profile");
      } finally {
        setLoading(false);
      }
    }

    if (userId) {
      fetchData();
    }
  }, [userId]);

  if (loading) {
    return (
      <div className="w-full max-w-4xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-48 bg-gray-200 rounded-lg mb-4"></div>
          <div className="space-y-3">
            <div className="h-6 bg-gray-200 rounded w-1/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="w-full max-w-4xl mx-auto p-6">
        <button
          onClick={() => router.back()}
          className="text-rose-600 hover:underline text-sm flex items-center mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back
        </button>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Profile Not Found</h2>
            <p className="text-gray-600">The requested profile could not be found.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <button
        onClick={() => router.back()}
        className="text-rose-600 hover:underline text-sm flex items-center mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back
      </button>

      <Card className="border-0 shadow-lg overflow-hidden">
        {/* Profile Header with Photo - further reduced height */}
        <div className="relative h-24 bg-gradient-to-r from-rose-500 to-rose-600">
          <div className="absolute -bottom-10 left-8">
            <div className="h-20 w-20 rounded-full border-4 border-white shadow-xl bg-white overflow-hidden">
              {profile.photo_url ? (
                <Image
                  src={profile.photo_url}
                  alt={profile.name}
                  width={80}
                  height={80}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center bg-rose-100 text-rose-600 text-2xl font-bold">
                  {profile.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          </div>
        </div>

        <CardHeader className="pt-14 px-8">
          <CardTitle className="text-2xl font-bold text-gray-900">
            {profile.name}
          </CardTitle>
          {profile.role && (
            <p className="text-rose-600 font-medium">{profile.role}</p>
          )}
          <div className="flex items-center gap-2 text-gray-600">
            <Mail className="w-4 h-4" />
            <span>{profile.email}</span>
          </div>
        </CardHeader>

        <CardContent className="px-8 pb-8 space-y-6">
          {/* Contact & Social Links */}
          <div className="space-y-4">
            {/* Only show phone number if user is admin */}
            {(isAdmin && profile.contact_number) && (
              <div className="flex items-center gap-3 text-gray-600">
                <Phone className="w-5 h-5 text-rose-500" />
                <span>{profile.contact_number}</span>
              </div>
            )}

            {profile.linkedin && (
              <a
                href={profile.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-gray-600 hover:text-rose-600"
              >
                <Linkedin className="w-5 h-5 text-rose-500" />
                <span>{profile.linkedin}</span>
              </a>
            )}

            {profile.github && (
              <a
                href={profile.github}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-gray-600 hover:text-rose-600"
              >
                <Github className="w-5 h-5 text-rose-500" />
                <span>{profile.github}</span>
              </a>
            )}
          </div>

          <Separator />

          {/* Experience & Education */}
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              {profile.years_of_experience && (
                <div className="flex gap-3">
                  <Briefcase className="w-5 h-5 text-rose-500 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Experience</h3>
                    <p className="text-gray-600">{profile.years_of_experience} Years</p>
                  </div>
                </div>
              )}

              {profile.education && (
                <div className="flex gap-3">
                  <GraduationCap className="w-5 h-5 text-rose-500 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Education</h3>
                    <p className="text-gray-600">{profile.education}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              {profile.programming_languages && (
                <div className="flex gap-3">
                  <Code className="w-5 h-5 text-rose-500 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Programming Languages</h3>
                    <p className="text-gray-600">{profile.programming_languages}</p>
                  </div>
                </div>
              )}

              {profile.expertise && (
                <div className="flex gap-3">
                  <Trophy className="w-5 h-5 text-rose-500 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Areas of Expertise</h3>
                    <p className="text-gray-600">{profile.expertise}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
