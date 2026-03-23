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
import { ArrowLeft, Upload, User, Building, FileText, Save, Bot, Mail } from "lucide-react";

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
  const [preferredModel, setPreferredModel] = useState("gemini-2.5-flash");
  const [smtpForm, setSmtpForm] = useState({
    smtpHost: "", smtpPort: 587, smtpUsername: "", smtpPassword: "",
    smtpFromEmail: "", smtpFromName: "",
  });

  const AI_MODELS = [
    { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash", provider: "Google", flag: "🌐", badge: "Default", badgeColor: "bg-blue-100 text-blue-700", desc: "Fast, capable, and great for English proposals. Best all-around choice.", bestFor: "English · Fast · Free tier" },
    { id: "deepseek-v3", name: "DeepSeek V3", provider: "DeepSeek", flag: "🇨🇳", badge: "Best for Chinese", badgeColor: "bg-red-100 text-red-700", desc: "Trained on massive Chinese datasets. Writes fluent, natural Chinese proposals that sound native.", bestFor: "Chinese · Mandarin · Bilingual" },
    { id: "deepseek-r1", name: "DeepSeek R1", provider: "DeepSeek", flag: "🇨🇳", badge: "Reasoning", badgeColor: "bg-orange-100 text-orange-700", desc: "DeepSeek's reasoning model. Thinks step-by-step for complex, technical proposals.", bestFor: "Chinese · Technical · Complex jobs" },
    { id: "gpt-4o", name: "GPT-4o", provider: "OpenAI", flag: "🇺🇸", badge: "Premium", badgeColor: "bg-green-100 text-green-700", desc: "OpenAI's flagship model. Excellent English writing quality, persuasive tone, and detailed proposals.", bestFor: "English · Premium quality" },
    { id: "gpt-4o-mini", name: "GPT-4o Mini", provider: "OpenAI", flag: "🇺🇸", badge: "Fast", badgeColor: "bg-emerald-100 text-emerald-700", desc: "Lighter version of GPT-4o. Faster and still high quality for standard proposals.", bestFor: "English · Speed · Cost-efficient" },
    { id: "claude-3-7-sonnet-20250219", name: "Claude 3.7 Sonnet", provider: "Anthropic", flag: "🇺🇸", badge: "Best Writing", badgeColor: "bg-purple-100 text-purple-700", desc: "Anthropic's best model. Produces the most polished, human-like proposal writing with excellent structure.", bestFor: "English · Best prose quality" },
    { id: "qwen-max", name: "Qwen Max", provider: "Alibaba", flag: "🇨🇳", badge: "Chinese Alt", badgeColor: "bg-yellow-100 text-yellow-700", desc: "Alibaba's top model. Strong Chinese language support, good for contractors in China or writing to Chinese clients.", bestFor: "Chinese · Alibaba ecosystem" },
  ];

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
      setPreferredModel(profile.preferredModel || "gemini-2.5-flash");
      setSmtpForm({
        smtpHost: profile.smtpHost || "",
        smtpPort: profile.smtpPort || 587,
        smtpUsername: profile.smtpUsername || "",
        smtpPassword: profile.smtpPassword || "",
        smtpFromEmail: profile.smtpFromEmail || "",
        smtpFromName: profile.smtpFromName || "",
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
      preferredModel,
      ...smtpForm,
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

        {/* AI Model Selector */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-2 mb-1">
            <Bot className="w-4 h-4 text-primary" />
            <h2 className="font-semibold text-foreground">AI Model</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">Choose which AI model writes your proposals. Different models excel at different languages and styles.</p>
          <div className="grid grid-cols-1 gap-3">
            {AI_MODELS.map(m => (
              <button
                key={m.id}
                onClick={() => setPreferredModel(m.id)}
                className={`text-left rounded-xl border-2 p-4 transition-all ${
                  preferredModel === m.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/40 bg-background"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{m.flag}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground text-sm">{m.name}</span>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${m.badgeColor}`}>{m.badge}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{m.provider} · {m.bestFor}</p>
                    </div>
                  </div>
                  {preferredModel === m.id && (
                    <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{m.desc}</p>
              </button>
            ))}
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

        {/* SMTP Configuration */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Mail className="w-4 h-4 text-primary" />
            <h2 className="font-semibold text-foreground">Custom Email (SMTP)</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">Configure your own SMTP server to send proposals from your custom email address. Leave blank to use default email delivery.</p>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium mb-2 block">SMTP Host</Label>
                <Input placeholder="smtp.gmail.com" value={smtpForm.smtpHost} onChange={e => setSmtpForm({...smtpForm, smtpHost: e.target.value})} />
              </div>
              <div>
                <Label className="text-sm font-medium mb-2 block">SMTP Port</Label>
                <Input type="number" placeholder="587" value={smtpForm.smtpPort} onChange={e => setSmtpForm({...smtpForm, smtpPort: parseInt(e.target.value) || 587})} />
              </div>
              <div>
                <Label className="text-sm font-medium mb-2 block">Username</Label>
                <Input placeholder="your-email@gmail.com" value={smtpForm.smtpUsername} onChange={e => setSmtpForm({...smtpForm, smtpUsername: e.target.value})} />
              </div>
              <div>
                <Label className="text-sm font-medium mb-2 block">Password</Label>
                <Input type="password" placeholder="••••••••" value={smtpForm.smtpPassword} onChange={e => setSmtpForm({...smtpForm, smtpPassword: e.target.value})} />
              </div>
              <div>
                <Label className="text-sm font-medium mb-2 block">From Email Address</Label>
                <Input type="email" placeholder="proposals@yourcompany.com" value={smtpForm.smtpFromEmail} onChange={e => setSmtpForm({...smtpForm, smtpFromEmail: e.target.value})} />
              </div>
              <div>
                <Label className="text-sm font-medium mb-2 block">From Name</Label>
                <Input placeholder="Your Company Name" value={smtpForm.smtpFromName} onChange={e => setSmtpForm({...smtpForm, smtpFromName: e.target.value})} />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">💡 Tip: For Gmail, use App Passwords instead of your regular password. Enable 2FA and generate an app-specific password.</p>
          </div>
        </div>

        <Button onClick={handleSave} disabled={updateMutation.isPending} className="w-full">
          {updateMutation.isPending ? "Saving..." : <><Save className="w-4 h-4 mr-1" /> Save All Changes</>}
        </Button>
      </div>
    </div>
  );
}
