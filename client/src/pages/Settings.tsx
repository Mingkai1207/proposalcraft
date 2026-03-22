import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useLocation } from "wouter";
import { getLoginUrl } from "@/const";
import { toast } from "sonner";
import { ArrowLeft, Upload, User, Building, FileText, Save } from "lucide-react";

export default function Settings() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: profile, isLoading, refetch } = trpc.profile.get.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const [form, setForm] = useState({
    businessName: "", ownerName: "", phone: "", email: "",
    address: "", licenseNumber: "", website: "", defaultTerms: "",
  });

  useEffect(() => {
    if (profile) {
      setForm({
        businessName: profile.businessName || "",
        ownerName: profile.ownerName || "",
        phone: profile.phone || "",
        email: profile.email || "",
        address: profile.address || "",
        licenseNumber: profile.licenseNumber || "",
        website: profile.website || "",
        defaultTerms: profile.defaultTerms || "",
      });
    }
  }, [profile]);

  const updateMutation = trpc.profile.update.useMutation({
    onSuccess: () => { toast.success("Profile saved successfully"); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const uploadLogoMutation = trpc.profile.uploadLogo.useMutation({
    onSuccess: () => { toast.success("Logo uploaded"); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  if (authLoading || isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" /></div>;
  }
  if (!isAuthenticated) { window.location.href = getLoginUrl(); return null; }

  const update = (field: string, value: string) => setForm(f => ({ ...f, [field]: value }));

  const handleSave = () => {
    updateMutation.mutate({
      ...form,
      email: form.email || undefined,
    });
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error("Logo must be under 2MB"); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      uploadLogoMutation.mutate({ base64, mimeType: file.type });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <div className="border-b border-border bg-white px-6 py-4 flex items-center gap-4 sticky top-0 z-10">
        <button onClick={() => navigate("/dashboard")} className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-semibold text-foreground">Settings</h1>
        <Button onClick={handleSave} disabled={updateMutation.isPending} size="sm" className="ml-auto">
          {updateMutation.isPending ? "Saving..." : <><Save className="w-4 h-4 mr-1" /> Save Changes</>}
        </Button>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
        {/* Logo */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Building className="w-4 h-4 text-primary" />
            <h2 className="font-semibold text-foreground">Business Logo</h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-muted rounded-xl flex items-center justify-center overflow-hidden border border-border">
              {profile?.logoUrl ? (
                <img src={profile.logoUrl} alt="Logo" className="w-full h-full object-contain" />
              ) : (
                <Building className="w-8 h-8 text-muted-foreground" />
              )}
            </div>
            <div>
              <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploadLogoMutation.isPending}>
                <Upload className="w-4 h-4 mr-1" />
                {uploadLogoMutation.isPending ? "Uploading..." : "Upload Logo"}
              </Button>
              <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 2MB. Appears on all proposals.</p>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
            </div>
          </div>
        </div>

        {/* Business Info */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Building className="w-4 h-4 text-primary" />
            <h2 className="font-semibold text-foreground">Business Information</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium mb-2 block">Business Name</Label>
              <Input placeholder="Smith HVAC Services" value={form.businessName} onChange={e => update("businessName", e.target.value)} />
            </div>
            <div>
              <Label className="text-sm font-medium mb-2 block">Owner / Contact Name</Label>
              <Input placeholder="John Smith" value={form.ownerName} onChange={e => update("ownerName", e.target.value)} />
            </div>
            <div>
              <Label className="text-sm font-medium mb-2 block">Phone</Label>
              <Input placeholder="(555) 123-4567" value={form.phone} onChange={e => update("phone", e.target.value)} />
            </div>
            <div>
              <Label className="text-sm font-medium mb-2 block">Business Email</Label>
              <Input type="email" placeholder="info@smithhvac.com" value={form.email} onChange={e => update("email", e.target.value)} />
            </div>
            <div>
              <Label className="text-sm font-medium mb-2 block">License Number</Label>
              <Input placeholder="LIC-123456" value={form.licenseNumber} onChange={e => update("licenseNumber", e.target.value)} />
            </div>
            <div>
              <Label className="text-sm font-medium mb-2 block">Website</Label>
              <Input placeholder="https://smithhvac.com" value={form.website} onChange={e => update("website", e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <Label className="text-sm font-medium mb-2 block">Business Address</Label>
              <Input placeholder="456 Business Ave, City, State 12345" value={form.address} onChange={e => update("address", e.target.value)} />
            </div>
          </div>
        </div>

        {/* Default Terms */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-4 h-4 text-primary" />
            <h2 className="font-semibold text-foreground">Default Terms & Conditions</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-3">These terms will be included in every proposal you generate.</p>
          <Textarea
            placeholder="e.g., Payment terms: 50% deposit required before work begins, balance due upon completion. All work is guaranteed for 1 year. Change orders must be approved in writing..."
            value={form.defaultTerms}
            onChange={e => update("defaultTerms", e.target.value)}
            rows={6}
            className="resize-none"
          />
        </div>

        <Button onClick={handleSave} disabled={updateMutation.isPending} className="w-full">
          {updateMutation.isPending ? "Saving..." : <><Save className="w-4 h-4 mr-1" /> Save All Changes</>}
        </Button>
      </div>
    </div>
  );
}
