"use client";

import { signOutAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Pencil, Save, X, ShieldCheck } from "lucide-react";

type AdminProfile = {
  id: string;
  name: string;
  email: string;
  created_at: string;
  updated_at: string;
};

export default function AdminProfile() {
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<AdminProfile>>({});

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch("/api/admin/profile");
        const data = await res.json();
        if (data.profile) {
          setProfile(data.profile);
          setFormData(data.profile);
        }
      } catch (error) {
        toast.error("Failed to load profile");
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      
      if (res.ok) {
        setProfile(formData as AdminProfile);
        setEditing(false);
        toast.success("Profile updated successfully");
      } else {
        toast.error("Failed to update profile");
      }
    } catch (error) {
      toast.error("Error updating profile");
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-3xl mx-auto p-6 text-center">
        Loading profile...
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto p-6">
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-4 space-y-4">
          <div className="flex items-center space-x-4">
            <div className="h-20 w-20 rounded-full bg-rose-100 flex items-center justify-center relative">
              <span className="text-2xl font-bold text-rose-600">
                {profile?.name?.charAt(0)?.toUpperCase() || "A"}
              </span>
              <ShieldCheck className="absolute -bottom-2 -right-2 h-6 w-6 text-rose-600" />
            </div>
            <div>
              <CardTitle className="text-2xl">Admin Profile</CardTitle>
              <p className="text-gray-500 mt-1">Manage your administrator account</p>
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
                <Label className="text-gray-700 font-medium">Role</Label>
                <p className="text-rose-600 font-medium">Administrator</p>
              </div>

              {profile?.created_at && (
                <div className="space-y-2">
                  <Label className="text-gray-700 font-medium">Admin Since</Label>
                  <p className="text-gray-600">
                    {new Date(profile.created_at).toLocaleDateString()}
                  </p>
                </div>
              )}
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

      <div className="mt-8 pt-6 border-t">
        <Button
          onClick={() => signOutAction()}
          variant="outline"
          className="w-full bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100 hover:text-rose-700"
        >
          Sign Out
        </Button>
      </div>
    </div>
  );
}
