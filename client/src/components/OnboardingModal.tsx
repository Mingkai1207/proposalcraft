import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, ArrowRight, X } from "lucide-react";
import { useLocation } from "wouter";

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function OnboardingModal({ isOpen, onClose }: OnboardingModalProps) {
  const [, navigate] = useLocation();

  const handleImport = () => {
    navigate("/import");
    onClose();
  };

  const handleSkip = () => {
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl">Welcome to ProposAI! 🚀</DialogTitle>
          <DialogDescription className="text-base mt-2">
            Let's get you started quickly
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Feature highlight */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Upload className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">Import Your Past Proposals</h3>
                <p className="text-sm text-muted-foreground">
                  Upload your previous proposals (PDF, Word, or text), and our AI will extract key information to create reusable templates and populate your profile automatically.
                </p>
              </div>
            </div>
          </div>

          {/* Benefits */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">What we'll extract:</p>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                Client names & contact information
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                Project scope & pricing details
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                Your business information
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                Reusable proposal templates
              </li>
            </ul>
          </div>

          {/* CTA Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              onClick={handleImport}
              className="flex-1"
              size="lg"
            >
              <Upload className="w-4 h-4 mr-2" />
              Import Proposals
            </Button>
            <Button
              onClick={handleSkip}
              variant="outline"
              size="lg"
              className="flex-1"
            >
              Skip for now
            </Button>
          </div>

          {/* Info text */}
          <p className="text-xs text-muted-foreground text-center">
            You can import proposals anytime from the dashboard or settings.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
