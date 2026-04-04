import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SuggestInput, SuggestTextarea } from "@/components/ui/suggest-input";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { ArrowLeft, Upload, User, Building, FileText, Save, Bot, Mail, AlertCircle, Trash2 } from "lucide-react";

export default function Settings() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: profile, isLoading, isError: profileError, refetch } = trpc.profile.get.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const [form, setForm] = useState({
    businessName: "", ownerName: "", phone: "", email: "",
    address: "", licenseNumber: "", website: "", defaultTerms: "",
  });
  const [preferredModel, setPreferredModel] = useState("claude-sonnet-4-6-thinking");
  const { data: subscription } = trpc.subscription.get.useQuery(undefined, { enabled: isAuthenticated });
  const isPaidUser = true; // TEMP: all models unlocked during promotional period
  const [smtpForm, setSmtpForm] = useState({
    smtpHost: "", smtpPort: 587, smtpUsername: "", smtpPassword: "",
    smtpFromEmail: "", smtpFromName: "",
  });
  const [smtpPasswordConfigured, setSmtpPasswordConfigured] = useState(false);
  const [followUpTemplate, setFollowUpTemplate] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");

  const AI_MODELS = [
    {
      id: "claude-sonnet-4-6-thinking",
      name: "Claude Sonnet 4.6",
      provider: "Anthropic",
      flag: "🇺🇸",
      badge: "All Plans",
      badgeColor: "bg-blue-100 text-blue-700",
      desc: "Anthropic's fast, capable model. Writes polished, professional proposals with excellent structure and persuasive language. Available to all users.",
      bestFor: "English · Fast · All plans",
      requiresPaid: false,
    },
    {
      id: "claude-opus-4-6",
      name: "Claude Opus 4.6",
      provider: "Anthropic",
      flag: "🇺🇸",
      badge: "All Plans",
      badgeColor: "bg-purple-100 text-purple-700",
      desc: "Anthropic's most powerful model. The highest-quality proposal writing available — deeply reasoned, highly persuasive, and tailored to win complex jobs.",
      bestFor: "English · Maximum quality · Starter & Pro",
      requiresPaid: true,
    },
  ];

  // Redirect to login if not authenticated (useEffect avoids setState-during-render warning)
  useEffect(() => {
    if (!authLoading && !isAuthenticated) navigate("/login");
  }, [authLoading, isAuthenticated]);

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
      setPreferredModel(profile.preferredModel || "claude-sonnet-4-6-thinking");
      setSmtpPasswordConfigured(profile.smtpPassword === "__configured__");
      setSmtpForm({
        smtpHost: profile.smtpHost || "",
        smtpPort: profile.smtpPort || 587,
        smtpUsername: profile.smtpUsername || "",
        smtpPassword: "", // never pre-populate — server returns "__configured__" sentinel
        smtpFromEmail: profile.smtpFromEmail || "",
        smtpFromName: profile.smtpFromName || "",
      });
      setFollowUpTemplate(profile.followUpTemplate || "");
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

  const deleteAccountMutation = trpc.auth.deleteAccount.useMutation({
    onSuccess: () => { navigate("/"); },
    onError: (e) => toast.error(e.message),
  });

  if (authLoading || isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" /></div>;
  }
  if (!isAuthenticated) return null;
  if (profileError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-10 h-10 text-destructive mx-auto mb-3" />
          <p className="text-muted-foreground mb-4">Failed to load settings</p>
          <Button onClick={() => refetch()}>Retry</Button>
        </div>
      </div>
    );
  }

  const update = (field: string, value: string) => setForm(f => ({ ...f, [field]: value }));

  const handleSave = () => {
    updateMutation.mutate({
      ...form,
      email: form.email || undefined,
      preferredModel,
      ...smtpForm,
      followUpTemplate: followUpTemplate || undefined,
    });
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error("Logo must be under 2MB"); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      const allowedMimeTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif"] as const;
      type AllowedMime = typeof allowedMimeTypes[number];
      if (!allowedMimeTypes.includes(file.type as AllowedMime)) {
        toast.error("Only PNG, JPEG, WebP, or GIF logos are allowed");
        return;
      }
      uploadLogoMutation.mutate({ base64, mimeType: file.type as AllowedMime });
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
              <SuggestInput placeholder="Smith HVAC Services" value={form.businessName} onChange={e => update("businessName", e.target.value)} />
            </div>
            <div>
              <Label className="text-sm font-medium mb-2 block">Owner / Contact Name</Label>
              <SuggestInput placeholder="John Smith" value={form.ownerName} onChange={e => update("ownerName", e.target.value)} />
            </div>
            <div>
              <Label className="text-sm font-medium mb-2 block">Phone</Label>
              <SuggestInput placeholder="(555) 123-4567" value={form.phone} onChange={e => update("phone", e.target.value)} />
            </div>
            <div>
              <Label className="text-sm font-medium mb-2 block">Business Email</Label>
              <SuggestInput type="email" placeholder="info@smithhvac.com" value={form.email} onChange={e => update("email", e.target.value)} />
            </div>
            <div>
              <Label className="text-sm font-medium mb-2 block">License Number</Label>
              <SuggestInput placeholder="LIC-123456" value={form.licenseNumber} onChange={e => update("licenseNumber", e.target.value)} />
            </div>
            <div>
              <Label className="text-sm font-medium mb-2 block">Website</Label>
              <SuggestInput placeholder="https://smithhvac.com" value={form.website} onChange={e => update("website", e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <Label className="text-sm font-medium mb-2 block">Business Address</Label>
              <SuggestInput placeholder="456 Business Ave, City, State 12345" value={form.address} onChange={e => update("address", e.target.value)} />
            </div>
          </div>
        </div>

        {/* AI Model Selector */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-2 mb-1">
            <Bot className="w-4 h-4 text-primary" />
            <h2 className="font-semibold text-foreground">AI Model</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">Choose which AI model writes your proposals. All models are available to all users during our promotional period.</p>
          <div className="grid grid-cols-1 gap-3">
            {AI_MODELS.map(m => {
              const isLocked = m.requiresPaid && !isPaidUser;
              return (
                <button
                  key={m.id}
                  onClick={() => {
                    if (isLocked) {
                      toast.error("Claude Opus 4.6 requires a Starter or Pro plan. Upgrade to unlock.");
                      return;
                    }
                    setPreferredModel(m.id);
                  }}
                  className={`text-left rounded-xl border-2 p-4 transition-all ${
                    isLocked
                      ? "border-border bg-muted/30 opacity-70 cursor-not-allowed"
                      : preferredModel === m.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/40 bg-background"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{m.flag}</span>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-foreground text-sm">{m.name}</span>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${m.badgeColor}`}>{m.badge}</span>
                          {isLocked && (
                            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">🔒 Upgrade to unlock</span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{m.provider} · {m.bestFor}</p>
                      </div>
                    </div>
                    {!isLocked && preferredModel === m.id && (
                      <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{m.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Default Terms */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-4 h-4 text-primary" />
            <h2 className="font-semibold text-foreground">Default Terms & Conditions</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-3">These terms will be included in every proposal you generate.</p>
          <SuggestTextarea
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
                <SuggestInput placeholder="smtp.gmail.com" value={smtpForm.smtpHost} onChange={e => setSmtpForm({...smtpForm, smtpHost: e.target.value})} />
              </div>
              <div>
                <Label className="text-sm font-medium mb-2 block">SMTP Port</Label>
                <Input type="number" placeholder="587" value={smtpForm.smtpPort} onChange={e => setSmtpForm({...smtpForm, smtpPort: parseInt(e.target.value) || 587})} />
              </div>
              <div>
                <Label className="text-sm font-medium mb-2 block">Username</Label>
                <SuggestInput placeholder="your-email@gmail.com" value={smtpForm.smtpUsername} onChange={e => setSmtpForm({...smtpForm, smtpUsername: e.target.value})} />
              </div>
              <div>
                <Label className="text-sm font-medium mb-2 block">Password</Label>
                <Input
                  type="password"
                  placeholder={smtpPasswordConfigured ? "Leave blank to keep existing password" : "App password or SMTP password"}
                  value={smtpForm.smtpPassword}
                  onChange={e => setSmtpForm({...smtpForm, smtpPassword: e.target.value})}
                />
              </div>
              <div>
                <Label className="text-sm font-medium mb-2 block">From Email Address</Label>
                <SuggestInput type="email" placeholder="proposals@yourcompany.com" value={smtpForm.smtpFromEmail} onChange={e => setSmtpForm({...smtpForm, smtpFromEmail: e.target.value})} />
              </div>
              <div>
                <Label className="text-sm font-medium mb-2 block">From Name</Label>
                <SuggestInput placeholder="Your Company Name" value={smtpForm.smtpFromName} onChange={e => setSmtpForm({...smtpForm, smtpFromName: e.target.value})} />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">💡 Tip: For Gmail, use App Passwords instead of your regular password. Enable 2FA and generate an app-specific password.</p>
          </div>
        </div>

        <div className="border border-border rounded-lg p-4 space-y-4">
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">Follow-up Email Template</h3>
          </div>
          <p className="text-sm text-muted-foreground">Customize the email sent to clients 48 hours after they receive a proposal (if unopened). Use placeholders: {'{clientName}'}, {'{proposalTitle}'}, {'{businessName}'}, {'{sentDate}'}.</p>
          <Textarea
            placeholder="Hi {clientName},\n\nI wanted to follow up on the proposal I sent you for {proposalTitle}. I haven't heard back yet, and I wanted to make sure you received it and had a chance to review it.\n\nIf you have any questions or would like to discuss the proposal further, I'm happy to help. Feel free to reach out anytime.\n\nBest regards,\n{businessName}\n\n---\nThis is a follow-up to your proposal sent on {sentDate}."
            value={followUpTemplate}
            onChange={e => setFollowUpTemplate(e.target.value)}
            className="min-h-[200px] font-mono text-sm"
          />
        </div>

        <Button onClick={handleSave} disabled={updateMutation.isPending} className="w-full">
          {updateMutation.isPending ? "Saving..." : <><Save className="w-4 h-4 mr-1" /> Save All Changes</>}
        </Button>

        {/* Danger Zone */}
        <div className="border border-destructive/30 rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-destructive" />
            <h3 className="font-semibold text-destructive">Danger Zone</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Permanently delete your account and all associated data. This action cannot be undone.
          </p>
          {!showDeleteConfirm ? (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowDeleteConfirm(true)}
            >
              Delete Account
            </Button>
          ) : (
            <div className="space-y-3 border border-destructive/30 rounded-lg p-4 bg-destructive/5">
              <p className="text-sm font-medium text-destructive">
                This will permanently delete all your proposals, templates, profile, and account data.
              </p>
              <div>
                <Label className="text-sm font-medium mb-2 block">Confirm with your password</Label>
                <input
                  type="password"
                  placeholder="Enter your password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-destructive/50"
                  maxLength={128}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={deleteAccountMutation.isPending || !deletePassword}
                  onClick={() => deleteAccountMutation.mutate({ password: deletePassword })}
                >
                  {deleteAccountMutation.isPending ? "Deleting…" : "Yes, delete my account"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setShowDeleteConfirm(false); setDeletePassword(""); }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
