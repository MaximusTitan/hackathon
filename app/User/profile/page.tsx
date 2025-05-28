"use client";

import { Button } from "@/components/ui/button";
import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Pencil, Save, X, UploadCloud } from "lucide-react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

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
  created_at: string;
};

export default function UserProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<Profile>>({});
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    async function fetchProfile() {
      const res = await fetch("/api/user/profile");
      const data = await res.json();
      if (data.profile) {
        setProfile(data.profile);
        setFormData(data.profile);
      }
      setLoading(false);
    }
    fetchProfile();
  }, []);

  // Handle profile photo upload
  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;
    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const filePath = `profile-photos/${profile.id}.${fileExt}`;
      // Upload to Supabase Storage (bucket: "profile-photos")
      const { error: uploadError } = await supabase.storage
        .from("profile-photos")
        .upload(filePath, file, { upsert: true });
      if (uploadError) {
        toast.error("Failed to upload photo");
        setUploading(false);
        return;
      }
      // Get public URL
      const { data } = supabase.storage.from("profile-photos").getPublicUrl(filePath);
      if (data?.publicUrl) {
        setFormData((prev) => ({ ...prev, photo_url: data.publicUrl }));
        setProfile((prev) => (prev ? { ...prev, photo_url: data.publicUrl } : prev));
        toast.success("Profile photo updated");
      }
    } catch (err) {
      toast.error("Photo upload failed");
    }
    setUploading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setProfile({ ...profile, ...formData } as Profile);
        setEditing(false);
        toast.success("Profile updated successfully");
      }
    } catch (error) {
      toast.error("Failed to update profile");
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-6">
      <Card className="border-0 shadow-lg relative bg-white">
        {/* Edit/Cancel/Save Buttons */}
        <div className="absolute top-6 right-6 flex gap-2">
          {!editing ? (
            <Button
              type="button"
              onClick={() => setEditing(true)}
              className="bg-rose-600 hover:bg-rose-700 text-white flex items-center gap-2 shadow-sm"
            >
              <Pencil className="h-4 w-4" />
              Edit Profile
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditing(false);
                  setFormData(profile || {});
                }}
                className="flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                Cancel
              </Button>
              <Button
                type="submit"
                form="profile-form"
                className="bg-rose-600 hover:bg-rose-700 text-white flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                Save Changes
              </Button>
            </div>
          )}
        </div>

        {/* Profile Header */}
        <CardHeader className="pb-6 border-b">
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="h-24 w-24 rounded-full bg-rose-100 flex items-center justify-center overflow-hidden border-4 border-white shadow-xl">
                {profile?.photo_url ? (
                  <img
                    src={formData.photo_url || profile.photo_url}
                    alt="Profile"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-3xl font-bold text-rose-600">
                    {profile?.name?.charAt(0)?.toUpperCase() || "U"}
                  </span>
                )}
              </div>
              {editing && (
                <>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handlePhotoChange}
                  />
                  <button
                    type="button"
                    className="absolute bottom-0 right-0 bg-white rounded-full p-2 shadow-lg hover:bg-gray-50 border border-gray-200"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    <UploadCloud className="w-4 h-4 text-rose-600" />
                  </button>
                </>
              )}
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-gray-900">
                {profile?.name || "My Profile"}
              </CardTitle>
              <p className="text-gray-500 mt-1">
                Manage your personal information and preferences
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-8">
          <form id="profile-form" onSubmit={handleSubmit}>
            <div className="grid md:grid-cols-2 gap-8">
              {/* Left Column */}
              <div className="space-y-6">
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Basic Information
                  </h3>
                  
                  {/* Name Field */}
                  <div className="space-y-2">
                    <Label className="text-gray-700">Full Name</Label>
                    {editing ? (
                      <Input
                        value={formData.name || ""}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, name: e.target.value }))
                        }
                        className="border-gray-200 focus:border-rose-500"
                      />
                    ) : (
                      <p className="text-gray-900 font-medium">{profile?.name}</p>
                    )}
                  </div>

                  {/* Email Field */}
                  <div className="space-y-2">
                    <Label className="text-gray-700">Email Address</Label>
                    <p className="text-gray-900">{profile?.email}</p>
                  </div>

                  {/* Contact Field */}
                  <div className="space-y-2">
                    <Label className="text-gray-700">Contact Number</Label>
                    {editing ? (
                      <Input
                        value={formData.contact_number || ""}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            contact_number: e.target.value,
                          }))
                        }
                        className="border-gray-200 focus:border-rose-500"
                        placeholder="Enter your contact number"
                      />
                    ) : (
                      <p className="text-gray-900">
                        {profile?.contact_number || (
                          <span className="text-gray-400 italic">Not provided</span>
                        )}
                      </p>
                    )}
                  </div>
                </div>

                {/* Education Section */}
                <div className="space-y-6 pt-6 border-t">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Educational Background
                  </h3>
                  
                  <div className="space-y-2">
                    <Label className="text-gray-700">Education</Label>
                    {editing ? (
                      <Input
                        value={formData.education || ""}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            education: e.target.value,
                          }))
                        }
                        className="border-gray-200 focus:border-rose-500"
                        placeholder="Enter your educational background"
                      />
                    ) : (
                      <p className="text-gray-900">
                        {profile?.education || (
                          <span className="text-gray-400 italic">Not provided</span>
                        )}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-700">Years of Experience</Label>
                    {editing ? (
                      <Input
                        value={formData.years_of_experience || ""}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            years_of_experience: e.target.value,
                          }))
                        }
                        className="border-gray-200 focus:border-rose-500"
                        placeholder="Enter years of experience"
                      />
                    ) : (
                      <p className="text-gray-900">
                        {profile?.years_of_experience || (
                          <span className="text-gray-400 italic">Not provided</span>
                        )}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Professional Links
                  </h3>

                  {/* LinkedIn Field */}
                  <div className="space-y-2">
                    <Label className="text-gray-700">LinkedIn Profile</Label>
                    {editing ? (
                      <Input
                        value={formData.linkedin || ""}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            linkedin: e.target.value,
                          }))
                        }
                        className="border-gray-200 focus:border-rose-500"
                        placeholder="https://linkedin.com/in/username"
                      />
                    ) : (
                      <div className="flex items-center gap-2">
                        {profile?.linkedin ? (
                          <a
                            href={profile.linkedin}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-rose-600 hover:underline"
                          >
                            {profile.linkedin}
                          </a>
                        ) : (
                          <span className="text-gray-400 italic">Not provided</span>
                        )
                        }
                      </div>
                    )}
                  </div>

                  {/* GitHub Field */}
                  <div className="space-y-2">
                    <Label className="text-gray-700">GitHub Profile</Label>
                    {editing ? (
                      <Input
                        value={formData.github || ""}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            github: e.target.value,
                          }))
                        }
                        className="border-gray-200 focus:border-rose-500"
                        placeholder="https://github.com/username"
                      />
                    ) : (
                      <div className="flex items-center gap-2">
                        {profile?.github ? (
                          <a
                            href={profile.github}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-rose-600 hover:underline"
                          >
                            {profile.github}
                          </a>
                        ) : (
                          <span className="text-gray-400 italic">Not provided</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Skills Section */}
                <div className="space-y-6 pt-6 border-t">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Skills & Expertise
                  </h3>

                  <div className="space-y-2">
                    <Label className="text-gray-700">Programming Languages</Label>
                    {editing ? (
                      <Input
                        value={formData.programming_languages || ""}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            programming_languages: e.target.value,
                          }))
                        }
                        className="border-gray-200 focus:border-rose-500"
                        placeholder="e.g. JavaScript, Python, Java"
                      />
                    ) : (
                      <p className="text-gray-900">
                        {profile?.programming_languages || (
                          <span className="text-gray-400 italic">Not provided</span>
                        )}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-700">Areas of Expertise</Label>
                    {editing ? (
                      <Input
                        value={formData.expertise || ""}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            expertise: e.target.value,
                          }))
                        }
                        className="border-gray-200 focus:border-rose-500"
                        placeholder="e.g. Web Development, Machine Learning"
                      />
                    ) : (
                      <p className="text-gray-900">
                        {profile?.expertise || (
                          <span className="text-gray-400 italic">Not provided</span>
                        )}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
