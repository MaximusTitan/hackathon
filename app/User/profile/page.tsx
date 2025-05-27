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
      <Card className="border-0 shadow-lg relative">
        {/* Edit Profile Button - top right */}
        {!editing && (
          <Button
            type="button"
            onClick={() => setEditing(true)}
            className="absolute top-4 right-4 bg-rose-600 hover:bg-rose-700 flex items-center"
          >
            <Pencil className="mr-2 h-4 w-4" />
            Edit Profile
          </Button>
        )}
        {/* Cancel/Save Buttons - top right when editing */}
        {editing && (
          <div className="absolute top-4 right-4 flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setEditing(false);
                setFormData(profile || {});
              }}
              className="flex items-center"
            >
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button
              type="submit"
              form="profile-form"
              className="bg-rose-600 hover:bg-rose-700 flex items-center"
            >
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
          </div>
        )}
        <CardHeader className="pb-4 space-y-4">
          <div className="flex items-center space-x-4">
            <div className="relative h-20 w-20 rounded-full bg-rose-100 flex items-center justify-center overflow-hidden">
              {profile?.photo_url ? (
                <img
                  src={formData.photo_url || profile.photo_url}
                  alt="Profile"
                  className="h-20 w-20 object-cover rounded-full"
                />
              ) : (
                <span className="text-2xl font-bold text-rose-600">
                  {profile?.name?.charAt(0)?.toUpperCase() || "U"}
                </span>
              )}
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
                    className="absolute bottom-0 right-0 bg-white rounded-full p-1 shadow hover:bg-gray-100"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    title="Upload Photo"
                  >
                    <UploadCloud className="w-5 h-5 text-rose-600" />
                  </button>
                </>
              )}
            </div>
            <div>
              <CardTitle className="text-2xl">My Profile</CardTitle>
              <p className="text-gray-500 mt-1">Manage your personal information</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form
            id="profile-form"
            onSubmit={handleSubmit}
            className="space-y-6"
          >
            <div className="grid gap-6">
              {/* Name */}
              <div className="space-y-2">
                <Label className="text-gray-700 font-medium">Name</Label>
                {editing ? (
                  <Input
                    value={formData.name || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, name: e.target.value }))
                    }
                    className="border-gray-200 focus:border-rose-500"
                  />
                ) : (
                  <p className="text-gray-900 font-medium text-lg">{profile?.name}</p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label className="text-gray-700 font-medium">Email</Label>
                <p className="text-gray-900">{profile?.email}</p>
              </div>

              {/* Contact Number */}
              <div className="space-y-2">
                <Label className="text-gray-700 font-medium">Contact Number</Label>
                {editing ? (
                  <Input
                    value={formData.contact_number || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, contact_number: e.target.value }))
                    }
                    placeholder="Your contact number"
                    className="border-gray-200 focus:border-rose-500"
                  />
                ) : (
                  <p className="text-gray-900">{profile?.contact_number || <span className="text-gray-500 italic">Not provided</span>}</p>
                )}
              </div>

              {/* LinkedIn */}
              <div className="space-y-2">
                <Label className="text-gray-700 font-medium">LinkedIn Profile</Label>
                {editing ? (
                  <Input
                    value={formData.linkedin || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, linkedin: e.target.value }))
                    }
                    placeholder="https://linkedin.com/in/yourprofile"
                    className="border-gray-200 focus:border-rose-500"
                  />
                ) : (
                  <div className="flex items-center space-x-2">
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
                      <p className="text-gray-500 italic">Not provided</p>
                    )}
                  </div>
                )}
              </div>

              {/* GitHub */}
              <div className="space-y-2">
                <Label className="text-gray-700 font-medium">GitHub</Label>
                {editing ? (
                  <Input
                    value={formData.github || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, github: e.target.value }))
                    }
                    placeholder="https://github.com/yourusername"
                    className="border-gray-200 focus:border-rose-500"
                  />
                ) : (
                  <div className="flex items-center space-x-2">
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
                      <p className="text-gray-500 italic">Not provided</p>
                    )}
                  </div>
                )}
              </div>

              {/* Educational Background */}
              <div className="space-y-2">
                <Label className="text-gray-700 font-medium">Educational Background</Label>
                {editing ? (
                  <Input
                    value={formData.education || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, education: e.target.value }))
                    }
                    placeholder="Your education"
                    className="border-gray-200 focus:border-rose-500"
                  />
                ) : (
                  <p className="text-gray-900">{profile?.education || <span className="text-gray-500 italic">Not provided</span>}</p>
                )}
              </div>

              {/* Years of Experience */}
              <div className="space-y-2">
                <Label className="text-gray-700 font-medium">Years of Experience</Label>
                {editing ? (
                  <Input
                    value={formData.years_of_experience || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, years_of_experience: e.target.value }))
                    }
                    placeholder="e.g. 2"
                    className="border-gray-200 focus:border-rose-500"
                  />
                ) : (
                  <p className="text-gray-900">{profile?.years_of_experience || <span className="text-gray-500 italic">Not provided</span>}</p>
                )}
              </div>

              {/* Programming Languages */}
              <div className="space-y-2">
                <Label className="text-gray-700 font-medium">Programming Languages</Label>
                {editing ? (
                  <Input
                    value={formData.programming_languages || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, programming_languages: e.target.value }))
                    }
                    placeholder="e.g. JavaScript, Python"
                    className="border-gray-200 focus:border-rose-500"
                  />
                ) : (
                  <p className="text-gray-900">{profile?.programming_languages || <span className="text-gray-500 italic">Not provided</span>}</p>
                )}
              </div>

              {/* Areas of Expertise */}
              <div className="space-y-2">
                <Label className="text-gray-700 font-medium">Areas of Expertise</Label>
                {editing ? (
                  <Input
                    value={formData.expertise || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, expertise: e.target.value }))
                    }
                    placeholder="e.g. Web Development, AI"
                    className="border-gray-200 focus:border-rose-500"
                  />
                ) : (
                  <p className="text-gray-900">{profile?.expertise || <span className="text-gray-500 italic">Not provided</span>}</p>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t">
              {editing ? (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setEditing(false);
                      setFormData(profile || {});
                    }}
                    className="flex items-center"
                  >
                    <X className="mr-2 h-4 w-4" />
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-rose-600 hover:bg-rose-700 flex items-center"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </Button>
                </>
              ) : null}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
