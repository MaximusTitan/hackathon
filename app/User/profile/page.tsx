"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Pencil, Save, X } from "lucide-react";

type Profile = {
  id: string;
  name: string;
  email: string;
  linkedin: string | null;
  created_at: string;
};

export default function UserProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<Profile>>({});

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      
      if (res.ok) {
        setProfile(formData as Profile);
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
    <div className="w-full max-w-3xl mx-auto p-6">
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-4 space-y-4">
          <div className="flex items-center space-x-4">
            <div className="h-20 w-20 rounded-full bg-rose-100 flex items-center justify-center">
              <span className="text-2xl font-bold text-rose-600">
                {profile?.name?.charAt(0)?.toUpperCase() || "U"}
              </span>
            </div>
            <div>
              <CardTitle className="text-2xl">My Profile</CardTitle>
              <p className="text-gray-500 mt-1">Manage your personal information</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-6">
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

              <div className="space-y-2">
                <Label className="text-gray-700 font-medium">Email</Label>
                <p className="text-gray-900">{profile?.email}</p>
              </div>

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
              ) : (
                <Button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="bg-rose-600 hover:bg-rose-700 flex items-center"
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit Profile
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
