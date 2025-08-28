"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, Trash2, ExternalLink, Upload, X, Settings } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

type RecruitingPartner = {
  id: string;
  event_id: string;
  name: string;
  logo_url: string;
  website_url: string;
  created_at: string;
};

interface InlineRecruitingPartnersAdminProps {
  eventId: string;
  isAdmin: boolean;
  onPartnersUpdate?: () => void;
}

export default function InlineRecruitingPartnersAdmin({ 
  eventId, 
  isAdmin, 
  onPartnersUpdate 
}: InlineRecruitingPartnersAdminProps) {
  const supabase = createClientComponentClient();
  const [partners, setPartners] = useState<RecruitingPartner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showManageDialog, setShowManageDialog] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [addForm, setAddForm] = useState({
    name: '',
    website_url: ''
  });
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (eventId) {
      fetchPartners();
    }
  }, [eventId]);

  const fetchPartners = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/recruiting-partners?eventId=${eventId}`);
      if (res.ok) {
        const data = await res.json();
        setPartners(data.partners || []);
        onPartnersUpdate?.();
      }
    } catch (error) {
      console.error('Error fetching partners:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      
      if (file.size > 2 * 1024 * 1024) {
        toast.error('File size must be less than 2MB');
        return;
      }
      
      setLogoFile(file);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadLogo = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('logo', file);
    formData.append('eventId', eventId);

    const res = await fetch('/api/admin/recruiting-partners/upload-logo', {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(error.error || `Upload failed (${res.status})`);
    }

    const data = await res.json();
    return data.publicUrl;
  };

  const handleAdd = async () => {
    if (!addForm.name.trim() || !addForm.website_url.trim()) {
      toast.error('Please fill in company name and website URL');
      return;
    }

    if (!logoFile) {
      toast.error('Please upload a logo file');
      return;
    }

    setAdding(true);
    try {
      let logoUrl = '';

      if (logoFile) {
        setUploading(true);
        try {
          logoUrl = await uploadLogo(logoFile);
        } catch (uploadError: any) {
          console.error('Logo upload failed:', uploadError);
          toast.error(uploadError.message || 'Failed to upload logo. Please try again.');
          return;
        } finally {
          setUploading(false);
        }
      }

      const res = await fetch('/api/admin/recruiting-partners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_id: eventId,
          name: addForm.name.trim(),
          logo_url: logoUrl,
          website_url: addForm.website_url.trim()
        })
      });

      if (res.ok) {
        toast.success('Recruiting partner added successfully');
        setShowAddDialog(false);
        resetForm();
        await fetchPartners();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to add recruiting partner');
      }
    } catch (error) {
      console.error('Error adding partner:', error);
      toast.error('Error adding recruiting partner');
    } finally {
      setAdding(false);
      setUploading(false);
    }
  };

  const resetForm = () => {
    setAddForm({ name: '', website_url: '' });
    setLogoFile(null);
    setLogoPreview(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this recruiting partner?')) {
      return;
    }

    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/recruiting-partners/${id}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        toast.success('Recruiting partner deleted successfully');
        await fetchPartners();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to delete recruiting partner');
      }
    } catch (error) {
      console.error('Error deleting partner:', error);
      toast.error('Error deleting recruiting partner');
    } finally {
      setDeletingId(null);
    }
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">Recruiting Partners</h3>
          <p className="text-sm text-gray-600">
            Manage company logos that appear on this event ({partners.length} partners)
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAddDialog(true)}
            className="text-rose-600 border-rose-600 hover:bg-rose-50"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Partner
          </Button>
          {partners.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowManageDialog(true)}
              className="text-gray-600 border-gray-300 hover:bg-gray-50"
            >
              <Settings className="w-4 h-4 mr-1" />
              Manage
            </Button>
          )}
        </div>
      </div>

      {/* Quick preview of current partners */}
      {partners.length > 0 && (
        <div className="mb-4 p-4 bg-gray-50 rounded-lg border">
          <div className="flex flex-wrap items-center gap-3">
            {partners.slice(0, 4).map((partner) => (
              <div key={partner.id} className="flex items-center justify-center p-2 bg-white rounded border shadow-sm">
                <Image
                  src={partner.logo_url}
                  alt={`${partner.name} Logo`}
                  width={60}
                  height={24}
                  className="object-contain max-h-4"
                  style={{ objectFit: 'contain' }}
                />
              </div>
            ))}
            {partners.length > 4 && (
              <div className="text-sm text-gray-500">
                +{partners.length - 4} more
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Partner Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Recruiting Partner</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Company Name *</Label>
              <Input
                id="name"
                value={addForm.name}
                onChange={(e) => setAddForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Airs, igebra.ai"
              />
            </div>
            
            <div>
              <Label>Logo *</Label>
              <div className="space-y-3">
                <div>
                  <Label className="text-sm text-gray-600">Upload Logo File</Label>
                  <div className="mt-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                      id="logo-upload"
                    />
                    <label
                      htmlFor="logo-upload"
                      className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      <Upload className="w-4 h-4" />
                      Choose File
                    </label>
                    {logoFile && (
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-sm text-gray-600">{logoFile.name}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setLogoFile(null);
                            setLogoPreview(null);
                          }}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <Label htmlFor="website_url">Website URL *</Label>
              <Input
                id="website_url"
                value={addForm.website_url}
                onChange={(e) => setAddForm(prev => ({ ...prev, website_url: e.target.value }))}
                placeholder="https://example.com"
              />
            </div>
            
            {logoPreview && (
              <div className="mt-4">
                <Label>Logo Preview</Label>
                <div className="mt-2 p-3 bg-gray-50 rounded-lg border flex items-center justify-center min-h-[80px]">
                  <Image
                    src={logoPreview}
                    alt="Logo preview"
                    width={120}
                    height={48}
                    className="object-contain max-h-12"
                    style={{ objectFit: 'contain' }}
                  />
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddDialog(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAdd}
              disabled={adding}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              {adding ? (uploading ? 'Uploading...' : 'Adding...') : 'Add Partner'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage Partners Dialog */}
      <Dialog open={showManageDialog} onOpenChange={setShowManageDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Recruiting Partners</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-4">
                      <div className="h-6 bg-gray-200 rounded mb-2"></div>
                      <div className="h-16 bg-gray-200 rounded mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : partners.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No recruiting partners added yet for this event.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {partners.map((partner) => (
                  <Card key={partner.id} className="relative">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center justify-between text-base">
                        <span className="truncate">{partner.name}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(partner.id)}
                          disabled={deletingId === partner.id}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="mb-3 p-3 bg-gray-50 rounded border flex items-center justify-center min-h-[60px]">
                        <Image
                          src={partner.logo_url}
                          alt={`${partner.name} logo`}
                          width={80}
                          height={32}
                          className="object-contain max-h-8"
                          style={{ objectFit: 'contain' }}
                        />
                      </div>
                      <div className="space-y-1">
                        <a
                          href={partner.website_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-sm flex items-center gap-1"
                        >
                          Visit Website
                          <ExternalLink className="w-3 h-3" />
                        </a>
                        <p className="text-xs text-gray-500">
                          Added: {new Date(partner.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setShowManageDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
